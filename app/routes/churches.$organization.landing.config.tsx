import { useLoaderData, useSubmit } from "react-router";
import { db } from "~/server/dbConnection";
import { churchOrganization, landingPageConfig } from "server/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import type { Route } from "../+types/root";

export const loader = async ({ params }: Route.LoaderArgs) => {
    const config = await db
        .select()
        .from(landingPageConfig)
        .where(eq(landingPageConfig.churchOrganizationId, params.organization))
        .then(res => res[0]);

    const organization = await db
        .select()
        .from(churchOrganization)
        .where(eq(churchOrganization.id, params.organization))
        .then(res => res[0]);

    return { config, organization };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
    const formData = await request.formData();
    const now = new Date();

    const configData = {
        heroImage: formData.get("heroImage") as string,
        heroHeadline: formData.get("heroHeadline") as string,
        heroSubheadline: formData.get("heroSubheadline") as string,
        aboutTitle: formData.get("aboutTitle") as string,
        aboutContent: formData.get("aboutContent") as string,
        footerContent: formData.get("footerContent") as string,
        socialLinks: formData.get("socialLinks") as string,
        contactEmail: formData.get("contactEmail") as string,
        contactPhone: formData.get("contactPhone") as string,
        contactAddress: formData.get("contactAddress") as string,
        updatedAt: now,
        churchOrganizationId: params.organization,
    };

    const existingConfig = await db
        .select()
        .from(landingPageConfig)
        .where(eq(landingPageConfig.churchOrganizationId, params.organization))
        .then(res => res[0]);

    if (existingConfig) {
        await db
            .update(landingPageConfig)
            .set(configData)
            .where(eq(landingPageConfig.churchOrganizationId, params.organization));
    } else {
        await db
            .insert(landingPageConfig)
            .values({
                ...configData,
                // createdAt will be set by defaultNow()
            });
    }

    return { success: true };
};

export default function LandingConfig() {
    const { config, organization } = useLoaderData<typeof loader>();
    const submit = useSubmit();
    const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
        config?.socialLinks ? JSON.parse(config.socialLinks) : {}
    );

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.set("socialLinks", JSON.stringify(socialLinks));
        submit(formData, { method: "post" });
        toast.success("Landing page configuration saved successfully");
    };

    const addSocialLink = () => {
        setSocialLinks(prev => ({
            ...prev,
            "": ""
        }));
    };

    const updateSocialLink = (oldPlatform: string, newPlatform: string, url: string) => {
        setSocialLinks(prev => {
            const newLinks = { ...prev };
            if (oldPlatform !== newPlatform) {
                delete newLinks[oldPlatform];
            }
            newLinks[newPlatform] = url;
            return newLinks;
        });
    };

    const removeSocialLink = (platform: string) => {
        setSocialLinks(prev => {
            const newLinks = { ...prev };
            delete newLinks[platform];
            return newLinks;
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Hero Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="heroImage">Hero Image URL</Label>
                        <Input
                            id="heroImage"
                            name="heroImage"
                            defaultValue={config?.heroImage}
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>
                    <div>
                        <Label htmlFor="heroHeadline">Headline</Label>
                        <Input
                            id="heroHeadline"
                            name="heroHeadline"
                            defaultValue={config?.heroHeadline}
                            placeholder={`Welcome to ${organization.name}`}
                        />
                    </div>
                    <div>
                        <Label htmlFor="heroSubheadline">Subheadline</Label>
                        <Input
                            id="heroSubheadline"
                            name="heroSubheadline"
                            defaultValue={config?.heroSubheadline}
                            placeholder="A place of worship, fellowship, and growth"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>About Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="aboutTitle">Title</Label>
                        <Input
                            id="aboutTitle"
                            name="aboutTitle"
                            defaultValue={config?.aboutTitle}
                            placeholder="About Us"
                        />
                    </div>
                    <div>
                        <Label htmlFor="aboutContent">Content</Label>
                        <Textarea
                            id="aboutContent"
                            name="aboutContent"
                            defaultValue={config?.aboutContent}
                            placeholder={organization.description}
                            rows={5}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Footer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="footerContent">Content</Label>
                        <Textarea
                            id="footerContent"
                            name="footerContent"
                            defaultValue={config?.footerContent}
                            placeholder="Additional footer content..."
                            rows={3}
                        />
                    </div>
                    <div>
                        <Label>Contact Information (Optional - will use organization details if not provided)</Label>
                        <div className="space-y-2 mt-2">
                            <Input
                                name="contactEmail"
                                defaultValue={config?.contactEmail}
                                placeholder={organization.email}
                            />
                            <Input
                                name="contactPhone"
                                defaultValue={config?.contactPhone}
                                placeholder={organization.phone}
                            />
                            <Input
                                name="contactAddress"
                                defaultValue={config?.contactAddress}
                                placeholder={`${organization.street}, ${organization.city}, ${organization.state} ${organization.zip}`}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <Label>Social Links</Label>
                            <Button type="button" variant="outline" onClick={addSocialLink}>
                                Add Link
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {Object.entries(socialLinks).map(([platform, url]) => (
                                <div key={`${platform}-${url}`} className="flex gap-2">
                                    <Input
                                        value={platform}
                                        onChange={(e) => updateSocialLink(platform, e.target.value, url)}
                                        placeholder="Platform (e.g., Facebook)"
                                    />
                                    <Input
                                        value={url}
                                        onChange={(e) => updateSocialLink(platform, platform, e.target.value)}
                                        placeholder="URL"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => removeSocialLink(platform)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit">Save Changes</Button>
            </div>
        </form>
    );
} 
