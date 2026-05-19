export interface EventMessage<T = Record<string, unknown>> {
  /** UUID для идемпотентности */
  id: string;
  type: string;
  payload: T;
  createdAt: string;
}
