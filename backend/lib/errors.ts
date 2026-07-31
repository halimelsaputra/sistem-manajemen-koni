/**
 * Custom error class untuk kesalahan validasi input dari pengguna.
 * Digunakan oleh Service Layer agar Route Handler dapat membedakan
 * antara kesalahan input (400 Bad Request) dan kesalahan server (500 Internal Server Error).
 */
export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}
