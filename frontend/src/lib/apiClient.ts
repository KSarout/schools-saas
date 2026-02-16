import { z } from "zod";
import api from "./api";
import type { AxiosRequestConfig } from "axios";

type Schema<T> = z.ZodType<T>;

export async function apiGet<T>(
    url: string,
    schema: Schema<T>,
    config?: AxiosRequestConfig
) {
    const res = await api.get(url, config);
    return schema.parse(res.data);
}

export async function apiPost<TBody, TRes>(
    url: string,
    body: TBody | undefined,
    schema: Schema<TRes>,
    config?: AxiosRequestConfig
) {
    const res = await api.post(url, body, config);
    return schema.parse(res.data);
}

export async function apiPut<TBody, TRes>(
    url: string,
    body: TBody | undefined,
    schema: Schema<TRes>,
    config?: AxiosRequestConfig
) {
    const res = await api.put(url, body, config);
    return schema.parse(res.data);
}

export async function apiDelete<T>(
    url: string,
    schema: Schema<T>,
    config?: AxiosRequestConfig
) {
    const res = await api.delete(url, config);
    return schema.parse(res.data);
}
