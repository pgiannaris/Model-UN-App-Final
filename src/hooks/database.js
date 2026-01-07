import pb from "../pocketbase";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

pb.autoCancellation(false);
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
    mutationFn: async (nameOrConfig) => {
      const config =
        typeof nameOrConfig == "string"
          ? configJsonTable(nameOrConfig)
          : nameOrConfig;
      return await pb.collections.create(config);
    },
    onError: errorHandler(`useCreateCollection()`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
  return mutation;
}

export function useRemoveCollection(name) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (name) => await pb.collections.delete(name),
    onError: errorHandler(`useRemoveCollection()`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
  return mutation;
}

export function useListCollections() {
  return useQuery({
    queryFn: async () => await pb.collections.getFullList(),
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
    queryFn: async () => await pb.collection(collection).getFullList(options),
    queryKey,
    onError: errorHandler(`useList('${collection}', ${options})`),
  });
}

export function useFind(collection, id) {
  return useQuery({
    queryFn: async () => {
      return await pb.collection(collection).getOne(id);
    },
    queryKey: [collection, id],
    onError: errorHandler(`useFind('${collection}', ${id})`),
  });
}

// This function is no longer needed as we'll use pb.getFileUrl directly
export function getUrl(record, filename, options) {
  console.warn("getUrl is deprecated, use pb.getFileUrl directly");
  return pb.getFileUrl(record, filename, options);
}

export function useInsert(collection) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data) => await pb.collection(collection).create(data),
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
    mutationFn: async ({ id, set }) =>
      pb.collection(collection).update(id, set),
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
    mutationFn: async (id) => await pb.collection(collection).delete(id),
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
      if (!list.data) return false;
      await Promise.all(
        list.data.map(async function (item) {
          return await pb.collection(collection).delete(item.id);
        }),
      );
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
      const result = await pb.collection(collection).getList(1, 1);
      if (result?.totalItems < 1) {
        if (!Array.isArray(data) || data.length < 1) return;
        await Promise.all(
          data.map(async function (item) {
            item = unstructured ? { document: item } : item;
            return await pb
              .collection(collection)
              .create(item, { requestKey: null });
          }),
        );
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

function configJsonTable(name) {
  return {
    name,
    type: "base",
    schema: [{ name: "document", type: "json" }],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  };
}
