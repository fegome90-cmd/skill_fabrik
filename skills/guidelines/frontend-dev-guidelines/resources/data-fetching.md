# Data Fetching (resumen)

- Queries con cache y retries configurados.
- Invalidar tras mutaciones.
- Errores visibles (toasts/boundaries).
- Evitar duplicar fetching en efectos.

## Ejemplo (TanStack Query)

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['user', id],
  queryFn: () => fetchUser(id),
  retry: 2,
  staleTime: 5000,
});

// Invalidar tras mutación
const mutation = useMutation({
  mutationFn: updateUser,
  onSuccess: () => {
    queryClient.invalidateQueries(['user', id]);
  },
});
```
