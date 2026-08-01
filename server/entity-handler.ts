import { default_entities } from "./entities"

interface EntityResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

function deserializeData(data: any): any {
    if (data?.__type === "Date") {
        return new Date(data.value);
    }
    if (data?.__type === "BigInt") {
        return BigInt(data.value);
    }
    if (Array.isArray(data)) {
        return data.map(deserializeData);
    }
    if (data && typeof data === "object") {
        return Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, deserializeData(v)])
        );
    }
    return data;
}

function serializeData(data: any): any {
    if (data instanceof Date) {
      console.log("serializeData"+data)
      return { __type: "Date", value: data.toISOString() };
    }
    if (typeof data === "bigint") {
        return { __type: "BigInt", value: data.toString() };
    }
    if (Array.isArray(data)) {
      return data.map((a)=>serializeData(a));
    }
    if (data && typeof data === "object") {
      return Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, serializeData(v)])
      );
    }
    return data;
  }

export async function handleEntityRequest(
    entity: string,
    method: string,
    args: any[]
): Promise<EntityResponse<any>> {
    try {
        const entityMethods = (default_entities as any)[entity];
        if (!entityMethods) {
            throw new Error(`Entity ${entity} not found`);
        }

        const handler = entityMethods[method];
        if (typeof handler !== "function") {
            throw new Error(`Method ${method} not found on ${entity}`);
        }

        const deserializedArgs = deserializeData(args);
        const result = await handler(...deserializedArgs);
        

        return {
            success: true,
            data: serializeData(result),
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: message };
    }
}