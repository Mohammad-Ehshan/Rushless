"use server";

import EmailTemplate from "@/components/emailTemplate";
import { SearchParams } from "@/components/search";
// import EmailTemplate from "@/components/email-template"
// import ViolationEmailTemplate from "@/components/violation-email-template"
import { connectToDB } from "@/lib/db";
import { Booking, BookingModel } from "@/schemas/booking";
import {
  ParkingLocation,
  ParkingLocationModel,
} from "@/schemas/parkingLocations";
// import { Booking, BookingModel } from "@/schemas/booking"
import {
  ActionResponse,
  BookingStatus,
  ParkingLocationStatus,
  UpdateLocationParams,
} from "@/types";
import { currentUser } from "@clerk/nextjs/server";
import { formatDate } from "date-fns";
// import { currentUser } from "@clerk/nextjs/server"
// import { compareAsc, format, formatDate } from "date-fns"
import { revalidatePath } from "next/cache";
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function toggleLocation({
  id,
  path,
}: {
  id: string;
  path: string;
}) {
  await connectToDB();

  const location = await ParkingLocationModel.findById<ParkingLocation>(id);

  if (location) {
    location.status =
      location.status === ParkingLocationStatus.AVAILABLE
        ? ParkingLocationStatus.NOTAVAILABLE
        : ParkingLocationStatus.AVAILABLE;

    const result = await location.save();

    if (result) {
      revalidatePath(path);
    }
  }
}

export async function deleteLocation({
  id,
  path,
}: {
  id: string;
  path: string;
}) {
  await connectToDB();

  const deleteResult = await ParkingLocationModel.findByIdAndDelete(id);

  if (deleteResult) {
    revalidatePath(path);
  }
}

export async function updateLocation({
  id,
  path,
  location,
}: {
  id: string;
  path: string;
  location: UpdateLocationParams;
}) {
  try {
    await connectToDB();

    const result = await ParkingLocationModel.updateOne(
      {
        _id: id,
      },
      {
        $set: location,
      }
    );

    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function findNearbyLocations(
  maxDistance: number,
  searchParams: SearchParams
) {
  try {
    await connectToDB();

    const st = new Date(
      `${searchParams.arrivingon}T${searchParams.arrivingtime}`
    );
    const et = new Date(
      `${searchParams.arrivingon}T${searchParams.leavingtime}`
    );

    // const parkingLocations: ParkingLocation[] = await ParkingLocationModel.find(
    //   {
    //     location: {
    //       $nearSphere: {
    //         $geometry: {
    //           type: "Point",
    //           coordinates: [
    //             searchParams.gpscoords.lng,
    //             searchParams.gpscoords.lat,
    //           ],
    //         },
    //         $maxDistance: maxDistance, // meters
    //       },
    //     },
    //   }
    // ).lean(); //return clean data

    const parkingLocations = await ParkingLocationModel.find({
        location: {
            $nearSphere: {
                $geometry: {
                    type: "Point",
                    coordinates: [
                        searchParams.gpscoords.lng,
                        searchParams.gpscoords.lat,
                    ],
                },
                $maxDistance: maxDistance,
            },
        },
    }).lean<ParkingLocation[]>();  // ✅ This ensures correct typing
    

    // go through all locations and find the bookings for it

    const availableLocations = await Promise.all(
      parkingLocations.map(async (location: ParkingLocation) => {
        const bookings = await BookingModel.find({
          locationid: location._id,
          status: BookingStatus.BOOKED,
          starttime: {
            $lt: et,
          },
          endtime: {
            $gt: st,
          },
        }).lean();

        if (bookings.length < location.numberofspots) {
          return { ...location, ...{ bookedspots: bookings.length } };
        } else
          return {
            ...location,
            ...{
              bookedspots: bookings.length,
              status: ParkingLocationStatus.FULL,
            },
          };
      })
    );

    return JSON.parse(JSON.stringify(availableLocations));
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getParkingLocation(id: string) {
  try {
    connectToDB();

    const location = await ParkingLocationModel.findById(id);

    return JSON.parse(JSON.stringify(location));
  } catch (error) {
    console.log(error);
    throw error;
  }
}


export async function sendConfirmationEmail(bookingid: string): Promise<ActionResponse> {

  try {
      // get the user
      const user = await currentUser()

      if (!user) {
          throw new Error('You must be logged in')
      }

      await connectToDB()

      const booking = await BookingModel.findById<Booking>(bookingid).populate({
          path: 'locationid', model: ParkingLocationModel
      }).lean()

      if (booking) {
          const { data, error } = await resend.emails.send({
              from: "PARKIFY <onboarding@resend.dev>",
              to: user?.primaryEmailAddress?.emailAddress!,
              subject: "Your booking has been confirmed",
              react: EmailTemplate({
                  firstName: user?.firstName!,
                  bookingDate: formatDate(booking.bookingdate, 'MMM dd, yyyy'),
                  arrivingOn: formatDate(booking.starttime, 'hh:mm a'),
                  leavingOn: formatDate(booking.endtime, 'hh:mm a'),
                  plateNo: booking.plate,
                  address: ((booking?.locationid as any) as ParkingLocation).address
              })
          })

          if (error) {
              console.log(error)
              return {
                  code: 1,
                  message: 'Failed to send email',
                  error: error
              }
          }

          return {
              code: 0,
              message: 'Email sent',
              error: error
          }
      }

      return {
          code: 1,
          message: 'Something went wrong',
      }

  } catch (error) {
      console.log(error)
      throw error
  }
}
