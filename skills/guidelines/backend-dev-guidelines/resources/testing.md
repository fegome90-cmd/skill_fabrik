# Testing (Detalles)

## Unit Tests (Servicios)

```typescript
describe('UserService', () => {
  it('should find user by id', async () => {
    const mockRepo = { findById: jest.fn().mockResolvedValue(user) };
    const service = new UserService(mockRepo);

    const result = await service.findById('123');

    expect(result).toEqual(user);
    expect(mockRepo.findById).toHaveBeenCalledWith('123');
  });
});
```

## Integration Tests (Endpoints)

- Testear flujo completo (request → response)
- Mockear servicios externos
- Validar códigos HTTP y formato de respuesta
