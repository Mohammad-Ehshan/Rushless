"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Upload,
  CheckCircle,
  Loader,
  ShieldAlert,
  Circle,
  TrafficCone,
  Activity,
  Timer,
  BarChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import CustomLoading from "@/components/CustomLoading";

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export default function Home() {
  const [TrafficAnalysis, setTrafficAnalysis] = useState({
    GreenLightTime: "",
    TrafficDensityAnalysis: "",
    VechicleAnalysis: "",
    SafetyPrecaution: "",
  });

  //timer
  const [time, setTime] = useState(60); // Default 60 seconds

  // Update timer when TrafficAnalysis.GreenLightTime changes
  useEffect(() => {
    if (TrafficAnalysis.GreenLightTime) {
      setTime(parseInt(TrafficAnalysis.GreenLightTime, 10)); // Ensure it's a number
    }
  }, [TrafficAnalysis.GreenLightTime]);

  // Start the countdown & Restart when time reaches 0
  useEffect(() => {
    if (time > 0) {
      const timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      // Restart timer when it hits 0
      setTime(parseInt(TrafficAnalysis.GreenLightTime, 10) || 60);
    }
  }, [time, TrafficAnalysis.GreenLightTime]);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "failure"
  >("idle");
  const [verificationResult, setVerificationResult] = useState<{
    GreenLightTime: number;
    TrafficDensityAnalysis: string;
    VehicleAnalysis: string;
    SafetyPrecaution: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleVerify = async () => {
    if (!file) return;

    setVerificationStatus("verifying");

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const base64Data = await readFileAsBase64(file);

      const imageParts = [
        {
          inlineData: {
            data: base64Data.split(",")[1],
            mimeType: file.type,
          },
        },
      ];

      // const prompt = `You are an expert in traffic analysis and road safety. Analyze this image and provide:

      // 1. **Red Light Duration**: An estimated red light duration (in seconds), dynamically adjusted based on traffic conditions. Prioritize emergency vehicles (ambulance, fire truck, police) by reducing red light duration if detected. Consider congestion levels and road safety regulations.
      // 2. **Traffic Density Analysis**: Categorize traffic density as Low, Medium, or High based on the number and type of vehicles present.
      // 3. **Vehicle Analysis**: Identify and analyze the types of vehicles present (e.g., cars, trucks, motorcycles, buses, bicycles, bullock carts, ambulances, police vehicles). Consider their impact on traffic flow.
      // 4. **Safety Precautions**: Recommend necessary safety measures based on traffic conditions, vehicle types, and potential risks. For example, if emergency vehicles are present, suggest clearing lanes; if non-motorized vehicles (bullock carts, bicycles) are mixed with fast-moving traffic, suggest speed regulation.

      // Respond *only* with a JSON object, without any additional text or formatting characters. Example format:

      // {
      //  "RedLightTime": estimated duration in seconds,
      //  "TrafficDensityAnalysis": "Low/Medium/High",
      //  "VehicleAnalysis": "Types of vehicles detected and their impact on traffic",
      //  "SafetyPrecaution": "Recommended safety measures based on traffic conditions"
      // }`;

      const prompt = `You are an expert in traffic analysis and road safety. Analyze this image and provide:

      1. **Green Light Duration**: Estimate the optimal green light duration (in seconds), dynamically adjusted based on traffic conditions.  
         - If emergency vehicles (ambulance, fire truck, police) are detected, increase green light duration to prioritize them.  
         - Adjust the time based on congestion levels, ensuring smooth traffic flow while maintaining road safety regulations.  
      
      2. **Traffic Density Analysis**: Categorize traffic density as **Low, Medium, or High**, considering:  
         - The number of vehicles.  
         - The type of vehicles (e.g., large vehicles like buses and trucks take more space).  
         - Lane occupancy percentage.  
      
      3. **Vehicle Analysis**: Identify and analyze the types of vehicles present, such as:  
         - **Emergency Vehicles** (ambulance, police, fire truck) → Require signal priority.  
         - **Heavy Vehicles** (buses, trucks) → May slow down movement.  
         - **Motorcycles, Bicycles** → Mixed traffic may require safety measures.  
         - **Non-motorized vehicles** (bullock carts, pedestrians) → Need special consideration.  
      
      4. **Safety Precautions**: Recommend necessary safety measures based on traffic conditions, vehicle types, and potential risks.  
         - If emergency vehicles are present, suggest **clearing lanes**.  
         - If non-motorized vehicles are mixed with fast-moving traffic, suggest **speed regulation**.  
         - If pedestrian movement is high, suggest **adjusting pedestrian signals**.  
      
      Respond *only* with a JSON object, without any additional text or formatting characters. Example format:
      
      {
        "GreenLightTime": estimated duration in seconds,
        "TrafficDensityAnalysis": "Low/Medium/High",
        "VehicleAnalysis": "Types of vehicles detected and their impact on traffic",
        "SafetyPrecaution": "Recommended safety measures based on traffic conditions"
      }`;

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const rawText = response.text();
      const text = rawText.replace(/```json|```/g, "").trim();
      console.log(text);

      try {
        const parsedResult = JSON.parse(text);
        if (
          parsedResult.GreenLightTime &&
          parsedResult.TrafficDensityAnalysis &&
          parsedResult.VehicleAnalysis &&
          parsedResult.SafetyPrecaution
        ) {
          setVerificationResult(parsedResult);
          setVerificationStatus("success");
        } else {
          console.error("Invalid verification result:", parsedResult);
          setVerificationStatus("failure");
        }
      } catch (error) {
        console.error("Failed to parse JSON response:", text);
        setVerificationStatus("failure");
      }
    } catch (error) {
      console.error("Error verifying waste:", error);
      setVerificationStatus("failure");
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f5f7fa_0%,#c3cfe2_100%)]">
      <div className="p-6 pb-12">
        <h1 className="text-center text-4xl font-bold border rounded-2xl">
          Traffic Light Monitoring <br />
          <span className="text-orange-400">In Real Time</span>
        </h1>
        {/* <p className="text-center pt-4">Find,Book, and manage parking spaces effortlessly <br/><span>with <span className="text-orange-400">RushLess</span>, Your Journey Start Here</span> </p> */}
      </div>
      <div className="mb-8 ">
        <label
          htmlFor="traffic-image"
          className="block text-lg text-center font-medium text-gray-700 mb-2"
        >
          Upload Traffic Image
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-500 transition-colors duration-300 bg-white cursor-pointer ">
          <div className="space-y-1 text-center ">
            <Upload className="mx-auto h-12 w-12 text-gray-400 " />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="traffic-image"
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500"
              >
                <span>Upload a file</span>
                <input
                  id="traffic-image"
                  name="traffic-image"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      </div>

      {preview && (
        <div className="mt-4 mb-8">
          <img
            src={preview}
            alt="Waste preview"
            className="max-w-full h-auto rounded-xl shadow-md  block mx-auto"
          />
        </div>
      )}

      <Button
        type="button"
        onClick={handleVerify}
        className="w-48 block mx-auto mb-8 bg-blue-700 hover:bg-green-700 text-white py-1 text-lg rounded-xl transition-colors cursor-pointer duration-300"
        disabled={!file || verificationStatus === "verifying"}
      >
        {verificationStatus === "verifying" ? (
          <>
            {/* <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
            Verifying... */}
            <CustomLoading loading={true} />
          </>
        ) : (
          "Analyse Traffic"
        )}
      </Button>

      {verificationStatus === "success" && verificationResult && (
        <div className="bg-blue-50 border-l-4 border-green-400 p-4 mb-8 rounded-r-xl">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
            <div>
              <h3 className="text-3xl font-medium text-center text-orange-800">
                Real Time Traffic Analysis
                <p className="text-xl text-blue-600">Powered By Rushless</p>
              </h3>
              <div className="flex justify-center items-center pt-8 pb-8">
                <div className="flex flex-col items-center bg-white w-[320px] border border-gray-300 rounded-3xl p-10 shadow-[10px_10px_30px_rgba(0,0,0,0.3)] transform hover:scale-105 transition-all duration-300 cursor-pointer">
                  {/* <!-- Green Circle --> */}
                  {/* <div className="w-32 h-32 bg-green-700 rounded-full animate-[growShrink_1.5s_infinite_ease-in-out]">{time}s</div> */}
                  <div className="w-32 h-32 bg-green-700 rounded-full animate-[growShrink_1.5s_infinite_ease-in-out] flex items-center justify-center text-white text-4xl font-bold">
                    {time}s
                  </div>

                  {/* <!-- Text Below the Circle --> */}
                  <div className="flex items-center text-green-700 mt-2 text-lg font-semibold">
                    <Timer className="w-6 h-6 mr-2" /> Green Light Time:{" "}
                    {verificationResult.GreenLightTime}
                  </div>

                  <div className="flex items-center text-blue-700 mt-2 text-lg font-semibold">
                    {/* <TrafficCone className="w-6 h-6 mr-2" />  */}
                    Traffic Density Analysis:{" "}
                    {verificationResult.TrafficDensityAnalysis}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-green-700 flex">
                <div className="flex flex-col items-center bg-white w-[720px] border border-gray-300 rounded-3xl p-5 shadow-[10px_10px_30px_rgba(0,0,0,0.3)] transform hover:scale-105 transition-all duration-300 cursor-pointer ml-5">
                <h1 className="text-3xl pb-4 text-blue-500 flex items-center">
                    <BarChart className="w-6 h-6 mr-2" /> Vechicle Analysis:
                  </h1>
                  <span className="text-black text-center">{verificationResult.VehicleAnalysis}</span>
                </div>
                <div className="flex flex-col items-center bg-white w-[720px] border border-gray-300 rounded-3xl p-5 shadow-[10px_10px_30px_rgba(0,0,0,0.3)] transform hover:scale-105 transition-all duration-300 cursor-pointer ml-5">
                  {/* <h1 className="text-3xl pb-4 text-blue-500"><ShieldAlert/> SafetyPrecaution:</h1> */}
                  <h1 className="text-3xl pb-4 text-blue-500 flex items-center">
                    <ShieldAlert className="w-6 h-6 mr-2" /> Safety Precaution:
                  </h1>

                  <span className="text-black text-center">{verificationResult.SafetyPrecaution}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
