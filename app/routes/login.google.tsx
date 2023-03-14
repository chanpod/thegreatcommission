import { LoaderArgs } from 'remix'
import { authenticator } from '~/server/auth/strategies/authenticaiton'


export let loader = ({ request }: LoaderArgs) => {
  return authenticator.authenticate('google', request, {
    successRedirect: '/',
    failureRedirect: '/login',
  })
}
