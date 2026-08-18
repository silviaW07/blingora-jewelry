/**
 * Full-page login / register — same card UI as GuestAuthScreen on Cart / Account.
 * Chrome Android often never applies the in-page guest form styles on /customerregister.
 */
'use client'

import { GuestAuthScreen } from '@/frontend/components/GuestAuthScreen'

export default function CustomerRegisterPage() {
  return <GuestAuthScreen initialTab="register" />
}
