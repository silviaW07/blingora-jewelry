/** Cap in-flight product images so first-screen thumbs are not starved. */

const MAX_IN_FLIGHT = 8

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
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve(take())
    }
    const timer = setTimeout(finish, 700)
    waiters.push(() => {
      clearTimeout(timer)
      finish()
    })
  })
}
