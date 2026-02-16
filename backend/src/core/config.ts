import dotenv from "dotenv";
dotenv.config();

function mustEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

// 👇 this is the important part
type JwtExpiresIn = `${number}${"s" | "m" | "h" | "d"}` | number;

export const config = {
    port: process.env.PORT ?? "4000",
    mongoUri: mustEnv("MONGO_URI"),

    jwtAccessSecret: mustEnv("JWT_ACCESS_SECRET"),
    jwtRefreshSecret: mustEnv("JWT_REFRESH_SECRET"),

    accessTokenExpires: (process.env.ACCESS_TOKEN_EXPIRES ??
        "15m") as JwtExpiresIn,

    refreshTokenExpires: (process.env.REFRESH_TOKEN_EXPIRES ??
        "7d") as JwtExpiresIn,
};
