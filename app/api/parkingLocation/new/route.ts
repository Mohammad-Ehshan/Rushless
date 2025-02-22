import { connectToDB } from "@/lib/db"
import { ParkingLocation, ParkingLocationModel } from "@/schemas/parkingLocations"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest,response: NextResponse) {
 try {
  await connectToDB()

  const formData= await request.formData()
  
  const data= formData.get('data') as string
  const parkingLocation = JSON.parse(data) as ParkingLocation

  const record = await ParkingLocationModel.create<ParkingLocation>({
    address: parkingLocation.address,
    gpscoords: parkingLocation.gpscoords,
    location: {
        coordinates: [parkingLocation.gpscoords.lng, parkingLocation.gpscoords.lat]
    },
    numberofspots: parkingLocation.numberofspots,
    price: parkingLocation.price,
    status: parkingLocation.status
})

return NextResponse.json({
    message: 'Parking location created',
    parkinglocation: record
})

 } catch (error) {
  console.log(error)
  return new NextResponse("Server error", { status: 500 })
 }
}