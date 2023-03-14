import { LoaderArgs } from 'remix'
import { authenticator } from '~/server/auth/strategies/authenticaiton'


export let loader = async ({ request }: LoaderArgs) => {
  return await authenticator.authenticate('google', request, {
    successRedirect: '/',
    failureRedirect: '/login',
  })
}
