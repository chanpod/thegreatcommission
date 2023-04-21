import { ChurchOrganization, OrganizationMemberShipRequest } from "@prisma/client";
import { format } from "date-fns";
import React from "react";
import OrgLocation from "../../organizations/OrgLocation";
import ChurchRowCard from "../../listItems/components/ChurchRowCard";
import { Button } from "flowbite-react";
import { InvitationStatus } from "~/src/types/invitation.types";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { XCircleIcon } from "@heroicons/react/24/solid";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/solid";

interface Props {
    request: OrganizationMemberShipRequest;
    acceptRequest?: (orgId: string, invitationId: string) => void;
    rejectRequest?: (orgId: string, invitationId: string) => void;
    showStatus?: boolean;
}

const OrgRequestCard = ({ request, acceptRequest, rejectRequest, showStatus }: Props) => {
    const organization: ChurchOrganization = request.requestingChurchOrganization as ChurchOrganization;

    function getStatusIcon(status: InvitationStatus) {
        switch (status) {
            case InvitationStatus.accepted:
                return (
                    <div>
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                    </div>
                );
            case InvitationStatus.declined:
                return (
                    <div>
                        <XCircleIcon className="w-6 h-6 text-red-500" />
                    </div>
                );
            case InvitationStatus.pending:
                return (
                    <div>
                        <QuestionMarkCircleIcon className="w-6 h-6 text-yellow-300" />
                    </div>
                );

            default:
                return undefined;
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-2">
                <div className="text-lg font-medium text-gray-800 ">Membership Request</div>
                <span className="text-sm text-gray-500">{format(new Date(request.createdAt), "MM-dd-yyyy")}</span>
                {showStatus && (
                    <div className="flex">
                        {getStatusIcon(request?.status as InvitationStatus)}
                        <div className="uppercase">{request.status}</div>
                    </div>
                )}
            </div>
            <hr className="mb-2" />
            <div>
                <ChurchRowCard church={organization} />
                {/* <div className="flex-1">
                    <div className="flex flex-col mb-4">
                        <CardLabel>Name</CardLabel>
                        <CardLabelData>{organization.name}</CardLabelData>
                    </div>
                    <div className="flex flex-col mb-4">
                        <CardLabel>Email</CardLabel>
                        <CardLabelData>{organization.email}</CardLabelData>
                    </div>
                    <div className="flex flex-col mb-4">
                        <CardLabel>Phone</CardLabel>
                        <CardLabelData>{organization.phone}</CardLabelData>
                    </div>

                    <div className="flex flex-col mb-4">
                        <CardLabel>Address</CardLabel>
                        <CardLabelData>
                            <OrgLocation org={organization} />
                        </CardLabelData>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex flex-col mb-4">
                        <CardLabel>Name</CardLabel>
                        <CardLabelData>{organization.}</CardLabelData>
                    </div>
                    <div className="flex flex-col mb-4">
                        <CardLabel>Email</CardLabel>
                        <CardLabelData>{organization.email}</CardLabelData>
                    </div>
                    <div className="flex flex-col mb-4">
                        <CardLabel>Phone</CardLabel>
                        <CardLabelData>{organization.phone}</CardLabelData>
                    </div>

                    <div className="flex flex-col mb-4">
                        <CardLabel>Address</CardLabel>
                        <CardLabelData>
                            <OrgLocation org={organization} />
                        </CardLabelData>
                    </div>
                </div> */}
            </div>

            <div className="flex justify-end mt-3 space-x-3">
                {rejectRequest && acceptRequest && (
                    <>
                        <Button className="bg-red-500" onClick={() => rejectRequest(organization.id, request.id)}>
                            Reject
                        </Button>
                        <Button className="bg-green-500" onClick={() => acceptRequest(organization.id, request.id)}>
                            Accept
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default OrgRequestCard;
