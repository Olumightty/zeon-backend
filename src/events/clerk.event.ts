import { prisma } from "../lib/prisma";
import type { ClerkWebhookEvent } from "../types/api/webhook";

export const userCreated = async(event: ClerkWebhookEvent) => {
    try {
        await prisma.user.create({
            data: {
                id: event.data.id,
                email: event.data.email_addresses[0]!.email_address,
                firstName: event.data.first_name,
                lastName: event.data.last_name,
                profileImageUrl: event.data.profile_image_url
            }
        });
        return true;
    } catch (error) {
        console.error("Error creating user:", error);
        return false;
    }
};

export const userUpdated = async(event: ClerkWebhookEvent) => {
    try {
        await prisma.user.update({
            where: {
                id: event.data.id
            },
            data: {
                email: event.data.email_addresses[0]!.email_address,
                firstName: event.data.first_name,
                lastName: event.data.last_name,
                profileImageUrl: event.data.profile_image_url
            }
        });
        return true;
    } catch (error) {
        console.error("Error updating user:", error);
        return false;
    }
};

export const userDeleted = async(event: ClerkWebhookEvent) => {
    try {
        await prisma.user.delete({
            where: {
                id: event.data.id
            }
        });
        return true;
    } catch (error) {
        console.error("Error deleting user:", error);
        return false;
    }
};

//add organization events after mvp