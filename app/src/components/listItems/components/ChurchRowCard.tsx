import { ChurchOrganization } from "@prisma/client";
import { Link } from "@remix-run/react";
import ChurchPlaceholderImage from "~/src/assets/images/placeholderImage1.jpg";
import OrgLocation from "../../organizations/OrgLocation";
import CardButton from "./MissionRowCard";

type Props = {
    church: ChurchOrganization;
    linkActive?: boolean;
};

export const CardLabel = ({ children }: any) => <label className="text-sm text-gray-500">{children}</label>;
export const CardLabelData = ({ children }: any) => <span className="text-gray-800">{children}</span>;

const ChurchRowCard = ({ church, linkActive }: Props) => {
    const card = (
        
            <div className="flex p-4 border border-gray-300 mb-4 rounded-lg shadow-md">
                <div className="w-full">
                    <div className="mb-2">
                        <h2 className="text-2xl">{church.name}</h2>
                    </div>
                    <div className="relative h-56 rounded-lg overflow-hidden">
                        <img
                            className="absolute object-cover w-full h-full"
                            src={ChurchPlaceholderImage}
                            alt="Church image"
                        />
                        {/* <div className="absolute w-[96%] justify-center text-center backdrop-blur-sm items-center top-1 z-10 rounded-md border-solid border-[#5e57573d] bg-[#30303559] p-2 m-2 text-white">
                        <h2 className="text-2xl">{church.name}</h2>
                    </div> */}
                    </div>
                    <div className=" py-2">
                        <CardLabelData>{church.description}</CardLabelData>
                        <div>
                            <OrgLocation org={church} />
                        </div>

                        {!linkActive && (<Link to={`/churches/${church.id}`} className="mt-2 block text-sm font-medium text-indigo-600 hover:text-indigo-500" style ={{maxWidth: '100px'}}>
                            Learn more
                        </Link>)}
                    </div>
                </div>
            </div>
        
    );

    return linkActive ? <Link to={`/churches/${church.id}`}><CardButton>{card}</CardButton></Link> : card;
};

export default ChurchRowCard;
