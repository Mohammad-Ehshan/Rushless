// 'use client'

// import { buildMapInfoCardContent, buildMapInfoCardContentForDestination, destinationPin, getStreetFromAddress, libs, parkingPin, parkingPinWithIndex } from "@/lib/utils"
// import { MapAddressType, MapParams } from "@/types"
// import { useJsApiLoader } from "@react-google-maps/api"
// import { useEffect, useRef } from "react"

// function Map({ mapParams }: { mapParams: string}) {

//     const params = JSON.parse(mapParams) as MapParams[]
//     let infoWindow: google.maps.InfoWindow

//     const { isLoaded } = useJsApiLoader({
//         nonce: "477d4456-f7b5-45e2-8945-5f17b3964752",
//         googleMapsApiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY as string,
//         libraries: libs
//     })

//     const mapRef = useRef<HTMLDivElement>(null)

//     const getPinType = (loc: MapParams): string => {
//         return loc.type === MapAddressType.DESTINATION ? 'parking_destination_tr' : 'parking_pin_tr'
//     }
//     useEffect(() => {
//         if (isLoaded) {
//             const mapOptions = {
//                 center: {
//                     lat: params[0].gpscoords.lat,
//                     lng: params[0].gpscoords.lng
//                 },
//                 zoom: 14,
//                 mapId: 'MY-MAP-ID-1234'
//             }

//             const gMap = new google.maps.Map(mapRef.current as HTMLDivElement, mapOptions)

//             setMarker(gMap)

//         }
//     },[isLoaded])

//     function setMarker(map: google.maps.Map) {
//         infoWindow = new google.maps.InfoWindow({
//             maxWidth: 200
//         })

//         params.map((loc, index) => {

//             const marker = new google.maps.marker.AdvancedMarkerElement({
//                 map: map,
//                 position: loc.gpscoords,
//                 title: loc.address
//             })

//             if (loc.type === MapAddressType.PARKINGLOCATION) {
//                 marker.setAttribute("content", buildMapInfoCardContent(getStreetFromAddress(loc.address),
//                 loc.address,
//                 loc.numberofspots as number,
//                 loc.price?.hourly as number))

//                 marker.content = parkingPinWithIndex(getPinType(loc), index).element
//             } else if(loc.type === MapAddressType.ADMIN) {
//                 marker.setAttribute("content", buildMapInfoCardContent(getStreetFromAddress(loc.address),
//                 loc.address,
//                 loc.numberofspots as number,
//                 loc.price?.hourly as number))

//                 marker.content = parkingPin(getPinType(loc)).element
//             } else {
//                 const cityCircle = new google.maps.Circle({
//                     strokeColor: '#00FF00',
//                     strokeOpacity: 0.8,
//                     strokeWeight: 2,
//                     fillColor: '#0FF000',
//                     fillOpacity: 0.35,
//                     map,
//                     center: {
//                         lat: params[0].gpscoords.lat,
//                         lng: params[0].gpscoords.lng
//                     },
//                     radius: loc.radius
//                 })

//                 marker.content = destinationPin(getPinType(loc)).element
//                 marker.setAttribute("content", buildMapInfoCardContentForDestination(getStreetFromAddress(loc.address), loc.address))
//             }

//             marker.addListener('click', () => {
//                 infoWindow.close()
//                 infoWindow.setContent(marker.getAttribute('content'))
//                 infoWindow.open({
//                     map,
//                     anchor: marker
//                 })
//             })
//         })
//     }

//     return (
//         <div className="flex flex-col space-y-4">
//             {
//                 isLoaded ? <div style={{ height: '600px'}} ref={mapRef} /> : <p>Loading...</p>
//             }
//         </div>
//     )
// }

// export default Map


//2nd code

'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapParams, MapAddressType } from '@/types';
import { buildMapInfoCardContent, buildMapInfoCardContentForDestination, getStreetFromAddress } from '@/lib/utils';

function Map({ mapParams }: { mapParams: string }) {
    const params = JSON.parse(mapParams) as MapParams[];
    const mapRef = useRef<HTMLDivElement>(null);
    let mapInstance: L.Map | null = null;

    useEffect(() => {
        if (!mapRef.current) return;

        if (!mapInstance) {
            mapInstance = L.map(mapRef.current).setView([
                params[0].gpscoords.lat,
                params[0].gpscoords.lng
            ], 14);
        }

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstance);

        setMarkers(mapInstance);

        return () => {
            if (mapInstance) {
                mapInstance.remove();
                mapInstance = null;
            }
        };
    }, []);

    // ✅ Function to determine which pin type to use
    const getPinType = (loc: MapParams): string => {
        return loc.type === MapAddressType.DESTINATION ? 'parking_destination_tr' : 'parking_pin_tr';
    };

    function setMarkers(map: L.Map | null) {
        if (!map) return;

        params.forEach((loc, index) => {
            const iconUrl = `http://localhost:3000/${getPinType(loc)}.png`;

            let customIcon: L.Icon | L.DivIcon;

            // ✅ Handle indexed markers differently (e.g., numbered parking pins)
            if (loc.type === MapAddressType.PARKINGLOCATION) {
                customIcon = L.divIcon({
                    className: 'custom-numbered-marker',
                    html: `<div class="marker-container">
                              <div class="marker-number">${index + 1}</div>
                              <img src="${iconUrl}" width="32" height="32" />
                           </div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 40]
                });
            } else {
                customIcon = L.icon({
                    iconUrl,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                });
            }

            const marker = L.marker([loc.gpscoords.lat, loc.gpscoords.lng], {
                title: loc.address,
                icon: customIcon
            }).addTo(map);

            let popupContent = '';

            if (loc.type === MapAddressType.PARKINGLOCATION || loc.type === MapAddressType.ADMIN) {
                popupContent = buildMapInfoCardContent(
                    getStreetFromAddress(loc.address),
                    loc.address,
                    loc.numberofspots as number,
                    loc.price?.hourly as number
                );
            } else {
                popupContent = buildMapInfoCardContentForDestination(
                    getStreetFromAddress(loc.address),
                    loc.address
                );

                L.circle([loc.gpscoords.lat, loc.gpscoords.lng], {
                    color: '#00FF00',
                    fillColor: '#0FF000',
                    fillOpacity: 0.35,
                    radius: loc.radius || 600
                }).addTo(map);
            }

            // ✅ Add click event to show popup (similar to Google Maps info window)
            marker.bindPopup(popupContent);
            marker.on('click', () => {
                marker.openPopup();
            });
        });
    }

    return (
        <div className="flex flex-col space-y-4">
            <div style={{ height: '600px' }} ref={mapRef} />
        </div>
    );
}

export default Map;


// //3rd code


// 'use client';

// import { useEffect, useRef } from 'react';
// import dynamic from 'next/dynamic';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
// import { MapParams, MapAddressType } from '@/types';
// import { buildMapInfoCardContent, buildMapInfoCardContentForDestination, getStreetFromAddress } from '@/lib/utils';

// // ✅ Load Leaflet only on the client side
// const Map = ({ mapParams }: { mapParams: string }) => {
//     const params = JSON.parse(mapParams) as MapParams[];
//     const mapRef = useRef<HTMLDivElement>(null);
//     const mapInstance = useRef<L.Map | null>(null);

//     useEffect(() => {
//         if (!mapRef.current || mapInstance.current) return;

//         // ✅ Initialize the map only once
//         mapInstance.current = L.map(mapRef.current).setView(
//             [params[0].gpscoords.lat, params[0].gpscoords.lng],
//             14
//         );

//         L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//             attribution: '&copy; OpenStreetMap contributors'
//         }).addTo(mapInstance.current);

//         setMarkers(mapInstance.current);

//         return () => {
//             mapInstance.current?.remove();
//             mapInstance.current = null;
//         };
//     }, []);

//     // ✅ Get the correct pin type
//     const getPinType = (loc: MapParams): string => {
//         return loc.type === MapAddressType.DESTINATION ? 'parking_destination' : 'parking_pin';
//     };

//     function setMarkers(map: L.Map | null) {
//         if (!map) return;

//         params.forEach((loc, index) => {
//             const iconUrl = `/icons/${getPinType(loc)}.png`; // ✅ Corrected path

//             let customIcon: L.Icon | L.DivIcon;

//             if (loc.type === MapAddressType.PARKINGLOCATION) {
//                 customIcon = L.divIcon({
//                     className: 'custom-numbered-marker',
//                     html: `<div class="marker-container">
//                               <div class="marker-number">${index + 1}</div>
//                               <img src="${iconUrl}" width="32" height="32" />
//                            </div>`,
//                     iconSize: [40, 40],
//                     iconAnchor: [20, 40]
//                 });
//             } else {
//                 customIcon = L.icon({
//                     iconUrl,
//                     iconSize: [32, 32],
//                     iconAnchor: [16, 32],
//                     popupAnchor: [0, -32]
//                 });
//             }

//             const marker = L.marker([loc.gpscoords.lat, loc.gpscoords.lng], {
//                 title: loc.address,
//                 icon: customIcon
//             }).addTo(map);

//             let popupContent = '';

//             if (loc.type === MapAddressType.PARKINGLOCATION || loc.type === MapAddressType.ADMIN) {
//                 popupContent = buildMapInfoCardContent(
//                     getStreetFromAddress(loc.address),
//                     loc.address,
//                     loc.numberofspots as number,
//                     loc.price?.hourly as number
//                 );
//             } else {
//                 popupContent = buildMapInfoCardContentForDestination(
//                     getStreetFromAddress(loc.address),
//                     loc.address
//                 );

//                 L.circle([loc.gpscoords.lat, loc.gpscoords.lng], {
//                     color: '#00FF00',
//                     fillColor: '#0FF000',
//                     fillOpacity: 0.35,
//                     radius: loc.radius || 100
//                 }).addTo(map);
//             }

//             marker.bindPopup(popupContent);
//             marker.on('click', () => {
//                 marker.openPopup();
//             });
//         });
//     }

//     return (
//         <div className="flex flex-col space-y-4">
//             <div style={{ height: '600px' }} ref={mapRef} />
//         </div>
//     );
// };

// // ✅ Ensure this component is only loaded on the client
// export default dynamic(() => Promise.resolve(Map), { ssr: false });
