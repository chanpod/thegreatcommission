import { ChurchOrganization, Missionary, Missions } from "@prisma/client";
import { ActionArgs, json } from "@remix-run/node";
import { Button } from "~/src/components/button/Button";
import { Input } from "~/src/components/forms/input/Input";
import { prismaClient } from "~/server/dbConnection";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { Form, useFetcher } from "@remix-run/react";
import { Card, Label, Textarea, TextInput } from "flowbite-react";
import { useEffect, useState } from "react";
import Datepicker from "react-tailwindcss-datepicker";
import { DateValueType } from "react-tailwindcss-datepicker/dist/types";
import SearchBar from "~/src/components/header/SearchBar";

export const action = async ({ request }: ActionArgs) => {
    console.log("Create missionary action");

    const user = await authenticator.isAuthenticated(request);

    if (request.method === "POST") {
        const form = await request.formData();

        const startDate = form.get("beginDate") as string;
        const endDate = form.get("endDate") as string;

        console.log("startDate", startDate);
        console.log("endDate", endDate);

        const newMissionary: Missions = {
            title: form.get("title") as string,
            beginDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            churchOrganizationId: form.get("churchOrganizationId") as string,
        };

        const response = await prismaClient.missions.create({
            data: newMissionary,
        });

        console.log("response", response);

        return json({
            newChurch: response,
        });
    }

    return json({ message: "Hello World" });
};

export default function CreateChurch() {
    const [startDate, setStartDate] = useState<DateValueType | undefined>();
    const [endDate, setEndDate] = useState<DateValueType | undefined>();
    const [selectedOrg, setSelectedOrg] = useState<ChurchOrganization | undefined>();

    const fetcher = useFetcher();

    const startDateChanged = (newValue: DateValueType) => {
        console.log("newValue:", newValue);
        setStartDate(newValue);
    };

    const endDateChanged = (newValue: DateValueType) => {
        console.log("newValue:", newValue);
        setEndDate(newValue);
    };

    function onChurchSelection(selected: ChurchOrganization | Missionary) {
        console.log(selected);
        setSelectedOrg(selected as ChurchOrganization);
    }

    return (
        <div className="flex-col space-y-5 ">
            <h1 className="text-3xl">Create a Missions Organization</h1>

            <Card className="text-black max-w-[700px]">
                <h1 className="text-3xl">Information</h1>
                <hr className="my-2" />
                <Form method="post" className="space-y-3">
                    <Input label="Title" name="title" />

                    <SearchBar
                        label="Associated Org"
                        showHeaders={false}
                        loadMissionaries={false}
                        onSelected={onChurchSelection}
                    />
                    <input style={{ display: "none" }} name="churchOrganizationId" value={selectedOrg?.id} />

                    <label className="input__label">Start Date</label>
                    <Datepicker
                        useRange={false}
                        name="beginDate"
                        asSingle={true}
                        value={startDate}
                        onChange={startDateChanged}
                    />
                    <input style={{ display: "none" }} name="beginDate" value={startDate?.startDate} />

                    <label className="input__label">Start Date</label>
                    <Datepicker
                        useRange={false}
                        name="endDate"
                        asSingle={true}
                        value={endDate}
                        onChange={endDateChanged}
                    />

                    <input style={{ display: "none" }} name="endDate" value={endDate?.startDate} />

                    <div id="textarea">
                        <div className="mb-2 block">
                            <Label htmlFor="comment" value="Description" />
                        </div>
                        <Textarea name="description" id="comment" required={true} rows={4} />
                    </div>
                    <Button type="submit">Submit</Button>
                </Form>
            </Card>
        </div>
    );
}
