// React Router generated types for route:
// routes/churches.$organization.childcheckin.verify.$secureId.tsx

import type * as T from "react-router/route-module"

import type { Info as Parent0 } from "../../+types/root.js"
import type { Info as Parent1 } from "./churches.js"
import type { Info as Parent2 } from "./churches.$organization.js"
import type { Info as Parent3 } from "./churches.$organization.childcheckin.js"

type Module = typeof import("../churches.$organization.childcheckin.verify.$secureId.js")

export type Info = {
  parents: [Parent0, Parent1, Parent2, Parent3],
  id: "routes/churches.$organization.childcheckin.verify.$secureId"
  file: "routes/churches.$organization.childcheckin.verify.$secureId.tsx"
  path: "verify/:secureId"
  params: {"organization": string; "secureId": string} & { [key: string]: string | undefined }
  module: Module
  loaderData: T.CreateLoaderData<Module>
  actionData: T.CreateActionData<Module>
}

export namespace Route {
  export type LinkDescriptors = T.LinkDescriptors
  export type LinksFunction = () => LinkDescriptors

  export type MetaArgs = T.CreateMetaArgs<Info>
  export type MetaDescriptors = T.MetaDescriptors
  export type MetaFunction = (args: MetaArgs) => MetaDescriptors

  export type HeadersArgs = T.HeadersArgs
  export type HeadersFunction = (args: HeadersArgs) => Headers | HeadersInit

  export type LoaderArgs = T.CreateServerLoaderArgs<Info>
  export type ClientLoaderArgs = T.CreateClientLoaderArgs<Info>
  export type ActionArgs = T.CreateServerActionArgs<Info>
  export type ClientActionArgs = T.CreateClientActionArgs<Info>

  export type HydrateFallbackProps = T.CreateHydrateFallbackProps<Info>
  export type ComponentProps = T.CreateComponentProps<Info>
  export type ErrorBoundaryProps = T.CreateErrorBoundaryProps<Info>
}