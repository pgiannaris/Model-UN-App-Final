import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const collections = new Map();

function errorHandler(name) {
  return (err, vars) => {
    const message = `Database Error: ${name}\n${err.message}`;
    console.error(message);
    if (vars) console.log(vars);
  };
}

export function useCreateCollection() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (name) => {
      if (name && !collections.has(name))
        return collections.set(name, new Map());
    },
    onError: errorHandler(`useCreateCollection()`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
  return mutation;
}

export function useRemoveCollection(name) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (name) => {
      if (name && collections.has(name)) return collections.delete(name);
    },
    onError: errorHandler(`useRemoveCollection()`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
  return mutation;
}

export function useListCollections() {
  return useQuery({
    queryFn: async () => collections.keys(),
    queryKey: ["collections"],
    onError: errorHandler(`useListCollections()`),
  });
}

export function useList(collection, options) {
  if (options?.filter) {
    options.filter = parseFilter(options.filter);
  }
  const queryKey = !options
    ? [collection]
    : [
        collection,
        ...Object.keys(options).map((k) => `${k}=${options[k].toString()}`),
      ];
  return useQuery({
    queryFn: async () => {
      if (!collections.has(collection)) {
        collections.set(collection, new Map());
      }
      return Array.from(collections.get(collection).values());
    },
    queryKey,
    onError: errorHandler(`useList('${collection}', ${options})`),
  });
}

function assertCollection(collection) {
  if (!collections.has(collection))
    throw new Error(`'${collection}' does not exist`);
}

export function useFind(collection, id) {
  return useQuery({
    queryFn: async () => {
      assertCollection(collection);
      const record = collections.get(collection).get(id);
      return record ? record : null;
    },
    queryKey: [collection, id],
    onError: errorHandler(`useFind('${collection}', ${id})`),
  });
}

function generateId() {
  const typedArray = new Uint8Array(10);
  const randomValues = window.crypto.getRandomValues(typedArray);
  return randomValues.join("");
}

export function useInsert(collection) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data) => {
      if (!collections.has(collection)) {
        collections.set(collection, new Map());
      }
      const id = generateId();
      return collections.get(collection).set(id, { ...data, id });
    },
    onError: errorHandler(`useInsert('${collection}')`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [collection] }),
  });
  mutation.call = mutation.mutate;
  mutation.callAsync = mutation.mutateAsync;
  return mutation;
}

export function useUpdate(collection) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ id, set }) => {
      assertCollection(collection);
      const c = collections.get(collection);
      const object = c.get(id);
      if (!object) return;
      return c.set(id, { ...object, ...set });
    },
    onError: errorHandler(`useUpdate('${collection}')`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [collection] }),
  });
  mutation.call = (id, set) => mutation.mutate({ id, set });
  mutation.callAsync = async (id, set) =>
    await mutation.mutateAsync({ id, set });
  return mutation;
}

export function useRemove(collection) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id) => {
      assertCollection(collection);
      return collections.get(collection).delete(id);
    },
    onError: errorHandler(`useRemove('${collection}')`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [collection] }),
  });
  mutation.call = mutation.mutate;
  mutation.callAsync = mutation.mutateAsync;
  return mutation;
}

export function useRemoveAll(collection) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (list) => {
      assertCollection(collection);
      const c = collections.get(collection);
      if (!c) return false;
      if (!list || !list.data) {
        list = { data: Array.from(c.values()) };
      }
      list.data.forEach(function (item) {
        c.delete(item.id);
      });
    },
    onError: errorHandler(`useRemoveAll('${collection}')`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [collection] }),
  });
  mutation.call = mutation.mutate;
  mutation.callAsync = mutation.mutateAsync;
  return mutation;
}

export function usePreload(collection, data, unstructured) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (list) => {
      if (collection && !collections.has(collection))
        return collections.set(collection, new Map());
      const c = collections.get(collection);

      if (c.size < 1) {
        if (!Array.isArray(data) || data.length < 1) return;
        data.forEach(function (item) {
          item = unstructured ? { document: item } : item;
          const id = item.id ? item.id : generateId();
          return c.set(id, { ...item, id });
        });
      }
    },
    onError: errorHandler(`usePreload('${collection}')`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [collection] }),
  });
  useEffect(() => {
    mutation.mutate();
  }, []);
}

export function useCountRecords(collection) {
  const [count, setCount] = useState(null);
  const [fields, setFields] = useState(null);
  async function getTotalItems() {
    const result = await pb.collection(collection).getList(1, 1);
    console.log(result);
    setCount(result.totalItems);
  }
  useEffect(() => {
    getTotalItems();
  }, []);
  return count;
}

// ======== UTIL Functions do not export ================
function parseFilter(filter) {
  if (filter && typeof filter === "object") {
    const conditions = [];
    for (let key of Object.keys(filter)) {
      conditions.push(
        filter[key] === null ? `${key}=null` : `${key}="${filter[key]}"`,
      );
    }
    return conditions.join("&&");
  }
  return filter;
}
