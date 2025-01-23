import { authenticator } from '~/server/auth/strategies/authenticaiton'
import type { Route } from "./+types";

export let loader = async ({ request }: Route.LoaderArgs) => {
  return await authenticator.authenticate('google', request, {
    successRedirect: '/',
  })
}
