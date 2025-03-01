// React Router generated types for route:
// routes/landing.$organization.forms.$formId.submit.tsx

import type * as T from "react-router/route-module"

import type { Info as Parent0 } from "../../+types/root.js"
import type { Info as Parent1 } from "./landing.$organization.js"
import type { Info as Parent2 } from "./landing.$organization.forms.js"
import type { Info as Parent3 } from "./landing.$organization.forms.$formId.js"

type Module = typeof import("../landing.$organization.forms.$formId.submit.js")

export type Info = {
  parents: [Parent0, Parent1, Parent2, Parent3],
  id: "routes/landing.$organization.forms.$formId.submit"
  file: "routes/landing.$organization.forms.$formId.submit.tsx"
  path: "submit"
  params: {"organization": string; "formId": string} & { [key: string]: string | undefined }
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