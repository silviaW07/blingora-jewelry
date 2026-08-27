/** Cap in-flight product images so first-screen thumbs are not starved. */

const MAX_IN_FLIGHT = 6

let inFlight = 0
const waiters: Array<() => void> = []

export function acquireImageSlot(priority: boolean): Promise<() => void> {
  const take = () => {
    inFlight += 1
    let released = false
    return () => {
      if (released) return
      released = true
      inFlight -= 1
      const next = waiters.shift()
      if (next) next()
    }
  }

  if (priority || inFlight < MAX_IN_FLIGHT) {
    return Promise.resolve(take())
  }

  return new Promise((resolve) => {
    waiters.push(() => resolve(take()))
  })
}
