import { z } from "zod";
import type { AxiosRequestConfig } from "axios";
import api, { ApiError } from "@/lib/api";

type Schema<T> = z.ZodType<T>;

function parseOrThrow<T>(schema: Schema<T>, data: unknown, url: string) {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
        // Keep this message generic in prod; log parsed.error in dev if you want
        throw new ApiError("Response validation failed", { status: 500, url });
    }
    return parsed.data;
}

export async function apiGet<T>(url: string, schema: Schema<T>, config?: AxiosRequestConfig) {
    const res = await api.get(url, config);
    return parseOrThrow(schema, res.data, url);
}

export async function apiPost<TBody, TRes>(
    url: string,
    body: TBody | undefined,
    schema: Schema<TRes>,
    config?: AxiosRequestConfig
) {
    const res = await api.post(url, body, config);
    return parseOrThrow(schema, res.data, url);
}

export async function apiPut<TBody, TRes>(
    url: string,
    body: TBody | undefined,
    schema: Schema<TRes>,
    config?: AxiosRequestConfig
) {
    const res = await api.put(url, body, config);
    return parseOrThrow(schema, res.data, url);
}

export async function apiPatch<TBody, TRes>(
    url: string,
    body: TBody | undefined,
    schema: Schema<TRes>,
    config?: AxiosRequestConfig
) {
    const res = await api.patch(url, body, config);
    return parseOrThrow(schema, res.data, url);
}

export async function apiDelete<T>(url: string, schema: Schema<T>, config?: AxiosRequestConfig) {
    const res = await api.delete(url, config);
    return parseOrThrow(schema, res.data, url);
}
