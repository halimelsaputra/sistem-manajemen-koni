-- PostgreSQL reference schema for the KONI audit trail.
--
-- This is intentionally not tied to a migration framework because no backend,
-- ORM, or migration tool exists in the repository yet. Adapt this file into
-- the migration system selected by the backend team; do not run it blindly in
-- production without replacing the role grants described at the end.

BEGIN;

CREATE TABLE public.audit_logs (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id        text NULL,
    action          text NOT NULL,
    entity_type     text NOT NULL,
    entity_id       text NULL,
    old_values      jsonb NULL,
    new_values      jsonb NULL,
    changed_fields  jsonb NULL,
    request_id      text NULL,
    ip_address      inet NULL,
    user_agent      text NULL,
    created_at      timestamptz NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT audit_logs_action_check CHECK (
        action IN (
            'CREATE',
            'UPDATE',
            'DELETE',
            'ARCHIVE',
            'LOGIN',
            'UPLOAD_DOCUMENT',
            'DOWNLOAD_DOCUMENT',
            'REPLACE_DOCUMENT'
        )
    ),
    CONSTRAINT audit_logs_entity_type_not_blank CHECK (btrim(entity_type) <> ''),
    CONSTRAINT audit_logs_changed_fields_is_array CHECK (
        changed_fields IS NULL OR jsonb_typeof(changed_fields) = 'array'
    )
);

CREATE INDEX audit_logs_entity_idx
    ON public.audit_logs (entity_type, entity_id);

CREATE INDEX audit_logs_actor_idx
    ON public.audit_logs (actor_id);

CREATE INDEX audit_logs_action_idx
    ON public.audit_logs (action);

CREATE INDEX audit_logs_created_at_idx
    ON public.audit_logs (created_at DESC);

-- Recursively redact sensitive values. Redaction is deliberately performed
-- again at the database boundary so a missed application-level field cannot
-- leak a credential into a permanent log.
CREATE OR REPLACE FUNCTION public.redact_audit_json(input_value jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
SET search_path = pg_catalog, public
AS $$
DECLARE
    result jsonb;
BEGIN
    IF input_value IS NULL THEN
        RETURN NULL;
    END IF;

    CASE jsonb_typeof(input_value)
        WHEN 'object' THEN
            SELECT COALESCE(
                jsonb_object_agg(
                    item.key,
                    CASE
                        WHEN lower(item.key) ~
                            '(password|passphrase|token|api[^a-z0-9]*key|authorization|session[^a-z0-9]*cookie|secret)'
                        THEN to_jsonb('[REDACTED]'::text)
                        ELSE public.redact_audit_json(item.value)
                    END
                ),
                '{}'::jsonb
            )
            INTO result
            FROM jsonb_each(input_value) AS item;

            RETURN result;

        WHEN 'array' THEN
            SELECT COALESCE(
                jsonb_agg(public.redact_audit_json(item.value) ORDER BY item.ordinality),
                '[]'::jsonb
            )
            INTO result
            FROM jsonb_array_elements(input_value) WITH ORDINALITY AS item(value, ordinality);

            RETURN result;

        ELSE
            RETURN input_value;
    END CASE;
END;
$$;

-- The only intended write interface. The application must call this function
-- on the SAME connection and inside the SAME transaction as the data mutation.
CREATE OR REPLACE FUNCTION public.record_audit_log(
    p_actor_id text,
    p_action text,
    p_entity_type text,
    p_entity_id text,
    p_old_values jsonb,
    p_new_values jsonb,
    p_changed_fields jsonb,
    p_request_id text DEFAULT NULL,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    inserted_id bigint;
BEGIN
    IF p_changed_fields IS NOT NULL
       AND jsonb_typeof(p_changed_fields) <> 'array' THEN
        RAISE EXCEPTION 'changed_fields must be a JSON array'
            USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        changed_fields,
        request_id,
        ip_address,
        user_agent
    )
    VALUES (
        p_actor_id,
        upper(p_action),
        p_entity_type,
        p_entity_id,
        public.redact_audit_json(p_old_values),
        public.redact_audit_json(p_new_values),
        public.redact_audit_json(p_changed_fields),
        p_request_id,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO inserted_id;

    RETURN inserted_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs is append-only; % is forbidden', TG_OP
        USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER audit_logs_no_update_or_delete
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.reject_audit_log_mutation();

CREATE TRIGGER audit_logs_no_truncate
BEFORE TRUNCATE ON public.audit_logs
FOR EACH STATEMENT
EXECUTE FUNCTION public.reject_audit_log_mutation();

-- PostgreSQL functions are executable by PUBLIC by default. Remove that access
-- and grant only to the actual runtime/read-only roles after those roles exist.
REVOKE ALL ON FUNCTION public.record_audit_log(
    text, text, text, text, jsonb, jsonb, jsonb, text, inet, text
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redact_audit_json(jsonb) FROM PUBLIC;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.audit_logs FROM PUBLIC;

-- Deployment template (replace role names after the backend roles are final):
-- GRANT EXECUTE ON FUNCTION public.record_audit_log(
--     text, text, text, text, jsonb, jsonb, jsonb, text, inet, text
-- ) TO koni_app_runtime;
-- GRANT SELECT ON TABLE public.audit_logs TO koni_audit_reader;
-- GRANT SELECT ON TABLE public.audit_logs TO koni_app_runtime;
-- Do not grant INSERT/UPDATE/DELETE/TRUNCATE on audit_logs to runtime roles.

COMMIT;
