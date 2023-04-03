import { ChurchOrganization } from "@prisma/client";

export enum InvitationTypes {
    Organization = "organization",
    Mission = "mission",
    Member = "member",
    Event = "event",
}

export enum InvitationStatus {
    pending = "pending",
    accepted = "accepted",
    declined = "declined",
    cancel = "cancel",
}
