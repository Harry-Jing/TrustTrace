export function readCheckId(param: unknown) {
  return typeof param === 'string' && param.length > 0 ? param : null
}
