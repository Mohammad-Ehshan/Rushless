import { Library } from "@googlemaps/js-api-loader"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
// import L from "leaflet";

// ✅ Dynamically import Leaflet to avoid SSR issues
import dynamic from "next/dynamic";

// This prevents SSR-related issues by ensuring Leaflet is only used on the client
const L = typeof window !== "undefined" ? require("leaflet") : null;

export const libs: Library[]=['core','maps','places','marker']

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAmountForDisplay(amount: number, currency: string) : string {
  let locales = currency === "INR" ? "en-IN" : "en-US"; // 'en-IN' for Indian Rupees and 'en-US' for US Dollars
 let numberFormat= new Intl.NumberFormat(locales, {
  style:'currency',
  currency: 'INR',
  currencyDisplay: 'symbol'
 })

 const formatedAmount= numberFormat.format(amount)

 return formatedAmount === "NA" ? "" : formatedAmount 
}

export function formatAmountForStripe(
  amount: number,
  currency: string
): number {

  let numberFormat = new Intl.NumberFormat(['en-US'], {
    style:'currency',
    currency: currency,
    currencyDisplay: 'symbol'
  })

  const parts = numberFormat.formatToParts(amount)
  let zeroDecimalCurrency: boolean = true

  for (let part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false
    }
  }

  return zeroDecimalCurrency ? amount : Math.round(amount * 100)
}

export function getStreetFromAddress(address:string){
  return address.split(',')[0] 
}

// export function getStreetFromAddress(address?: string) {
//   return address ? address.split(',')[0] : 'Unknown Address';
// }



/// google maps
// export const buildMapInfoCardContent = (title: string, address: string, totalSpots: number, price: number)
// : string => {

//   return `
//     <div class="map_infocard_content">
//       <div class="map_infocard_title">${title}</div>
//       <div class="map_infocard_body">
//       <div>${address}</div>
//       <hr />
//       <div>Total spots: ${totalSpots}</div>
//       <div>Hourly price: ${formatAmountForDisplay(price, 'CAD')}</div>
//       </div>
      
//   </div>
//   `
// }

// export const buildMapInfoCardContentForDestination = (title: string, address: string): string => {
//   return `
//   <div class="map_infocard_content">
//       <div class="map_infocard_title">${title}</div>
//       <div class="map_infocard_body">
//       <div>${address}</div>
//       </div>
      
//   </div>`;
// }

// export const parkingPin = (type: string) => {
//   const glyphImg = document.createElement('div')
//   glyphImg.innerHTML = `
//     <div class="map_pin_container">
//       <img src='http://localhost:3000/${type}.png' />
//     </div>
//   `

//   const pinElement = new google.maps.marker.PinElement({
//     glyph: glyphImg
//   })

//   return pinElement
// }

// export const parkingPinWithIndex = (type: string, index: number) => {
//   const glyphImg = document.createElement('div')
//   glyphImg.innerHTML = `
//     <div class="map_pin_container">
//       <div class="map_pin_id"><span>${index}</span></div>
//       <img src='http://localhost:3000/${type}.png' />
//     </div>
//   `

//   const pinElement = new google.maps.marker.PinElement({
//     glyph: glyphImg
//   })

//   return pinElement
// }

// export const destinationPin = (type: string) => {
//   const glyphImg = document.createElement('img');
//   glyphImg.src = `http://localhost:3000/${type}.png`;
//   const pinElement = new google.maps.marker.PinElement({
//       glyph: glyphImg
//   })

//   return pinElement
// }


// leaflet

export const buildMapInfoCardContent = (
  title: string,
  address: string,
  totalSpots: number,
  price: number
): string => {
  return `
    <div class="map_infocard_content">
      <div class="map_infocard_title">${title}</div>
      <div class="map_infocard_body">
        <div>${address}</div>
        <hr />
        <div>Total spots: ${totalSpots}</div>
        <div>Hourly price: ${price} Rs</div>
      </div>
    </div>
  `;
};

export const buildMapInfoCardContentForDestination = (
  title: string,
  address: string
): string => {
  return `
    <div class="map_infocard_content">
      <div class="map_infocard_title">${title}</div>
      <div class="map_infocard_body">
        <div>${address}</div>
      </div>
    </div>
  `;
};

// Custom icon for parking locations
export const parkingPin = (type: string) => {
  return L.icon({
    // iconUrl: `/icons/${type}.jpg`, // Ensure these images exist in your "public/icons" folder
    iconUrl:`/${type}.png` ,

    iconSize: [32, 32], // Adjust the size as needed
    iconAnchor: [16, 32], // Anchor at bottom center
    popupAnchor: [0, -32],
  });
};

// Custom icon with index for numbered parking markers
export const parkingPinWithIndex = (type: string, index: number) => {
  return L.divIcon({
    className: "custom-pin",
    // <img src='/icons/${type}.png' />
    html: `<div class="map_pin_container">
             <div class="map_pin_id"><span>${index}</span></div>
            <img src='/${type}.png' />

           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Destination marker
export const destinationPin = (type: string) => {
  return L.icon({
    iconUrl: `/icons/${type}.png`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};


//get time
// Renaming to avoid conflict with TypeScript's built-in ReturnType
type TimeSlot = {
  time: string;
  display: string;
};

export function getTimeSlots(startTime = "00:00", endTime = "23:45"): TimeSlot[] {
  const timeArray: TimeSlot[] = [];
  const parsedStartTime: Date = new Date(`2000-01-01T${startTime}:00`);
  const parsedEndTime: Date = new Date(`2000-01-01T${endTime}:00`);

  let currentTime: Date = parsedStartTime;
  while (currentTime <= parsedEndTime) {
    const hours = currentTime.getHours().toString().padStart(2, "0");
    const minutes = currentTime.getMinutes().toString().padStart(2, "0");
    const ampm = currentTime.getHours() < 12 ? "AM" : "PM";
    const timeString = `${hours}:${minutes} ${ampm}`;
    timeArray.push({
      time: `${hours}:${minutes}`,
      display: timeString,
    });

    currentTime.setMinutes(currentTime.getMinutes() + 30);
  }

  return timeArray;
}
