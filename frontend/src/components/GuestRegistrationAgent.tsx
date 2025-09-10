import React, { useState } from "react";
//import { fillGuestForm } from "../utils/pdfUtils";
import { fillGuestForms } from "../utils/pdfUtils";

import {
  Calendar,
  Users,
  Mail,
  FileText,
  Upload,
  Send,
  User,
  CreditCard,
  Clock,
  Car,
  MapPin,
  Camera,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const GuestRegistrationAgent: React.FC = () => {
  const [currentStep, setCurrentStep] = useState("initial");
  const [unitNumber, setUnitNumber] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [guests, setGuests] = useState<any[]>([]);
  const [currentGuestIndex, setCurrentGuestIndex] = useState(0);
  const [currentGuest, setCurrentGuest] = useState<any>({
    name: "",
    idNumber: "",
    contactNumber: "",
    vehicleMake: "",
    vehicleReg: "",
    parkingBay: "",
    checkIn: "",
    checkOut: "",
    duration: "",
    idDocument: null,
  });
  const [pdfTemplate, setPdfTemplate] = useState<File | null>(null);
  const [emailAddresses, setEmailAddresses] = useState("");
  const [customHeading, setCustomHeading] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateDuration = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return "";
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
  };

  const handleCurrentGuestChange = (field: string, value: any) => {
    const updatedGuest = { ...currentGuest, [field]: value };

    if (field === "checkIn" || field === "checkOut") {
      updatedGuest.duration = calculateDuration(
        field === "checkIn" ? value : currentGuest.checkIn,
        field === "checkOut" ? value : currentGuest.checkOut
      );
    }

    setCurrentGuest(updatedGuest);
  };

  const handleUnitAndGuestCountSubmit = () => {
    const count = parseInt(guestCount);
    if (count > 0 && count <= 20 && unitNumber.trim()) {
      setGuests(
        Array(count)
          .fill(null)
          .map(() => ({
            name: "",
            idNumber: "",
            contactNumber: "",
            vehicleMake: "",
            vehicleReg: "",
            parkingBay: "",
            checkIn: "",
            checkOut: "",
            duration: "",
            idDocument: null,
          }))
      );
      setCurrentStep("guestInfo");
    }
  };

  const handleNextGuest = () => {
    const updatedGuests = [...guests];
    updatedGuests[currentGuestIndex] = { ...currentGuest };
    setGuests(updatedGuests);

    if (currentGuestIndex < guests.length - 1) {
      setCurrentGuestIndex(currentGuestIndex + 1);
      setCurrentGuest(
        guests[currentGuestIndex + 1] || {
          name: "",
          idNumber: "",
          contactNumber: "",
          vehicleMake: "",
          vehicleReg: "",
          parkingBay: "",
          checkIn: "",
          checkOut: "",
          duration: "",
          idDocument: null,
        }
      );
    } else {
      setCurrentStep("pdfUpload");
    }
  };

  const handlePrevGuest = () => {
    if (currentGuestIndex > 0) {
      const updatedGuests = [...guests];
      updatedGuests[currentGuestIndex] = { ...currentGuest };
      setGuests(updatedGuests);

      setCurrentGuestIndex(currentGuestIndex - 1);
      setCurrentGuest(guests[currentGuestIndex - 1]);
    }
  };

  const handleIdDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === "application/pdf" || file.type.startsWith("image/"))) {
      handleCurrentGuestChange("idDocument", file);
    } else {
      alert("Please upload a valid PDF or image file (PNG, JPG, etc.).");
    }
  };

  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfTemplate(file);
      setCurrentStep("emailConfig");
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const generateHeading = () => {
    if (customHeading.trim()) return customHeading;

    const guestNames = guests.map((g) => g.name).filter((name) => name.trim());
    if (guestNames.length === 1) {
      return `Guest Submission - Unit ${unitNumber} - ${guestNames[0]}`;
    } else if (guestNames.length > 1) {
      return `Group Submission - Unit ${unitNumber} - ${guestNames.slice(0, 2).join(", ")}${guestNames.length > 2 ? " & others" : ""}`;
    }
    return `Guest Registration Form - Unit ${unitNumber}`;
  };

  const toBase64 = (file: File) =>
    new Promise<{ name: string; content: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () =>
        resolve({ name: file.name, content: (reader.result as string).split(",")[1] });
      reader.onerror = reject;
    });

  const handleProcessDocuments = async () => {
    setIsProcessing(true);

    try {
      // 1) Create filled PDF
      // let completedPdf: File | null = null;
      // if (pdfTemplate) {
      //   completedPdf = await fillGuestForm(pdfTemplate, guests, unitNumber);
      // }

      // // 2) Collect all files (completed form + IDs)
      // const filesToSend: File[] = [];
      // if (completedPdf) filesToSend.push(completedPdf);
      // guests.forEach((g) => g.idDocument && filesToSend.push(g.idDocument));
      let completedPdfs: File[] = [];
    if (pdfTemplate) {
      completedPdfs = await fillGuestForms(pdfTemplate, guests, unitNumber);
    }

    const filesToSend: File[] = [...completedPdfs];
    guests.forEach((g) => g.idDocument && filesToSend.push(g.idDocument));


      const attachments = await Promise.all(filesToSend.map((f) => toBase64(f)));

      // 3) Send email via backend
      const response = await fetch(`${API_BASE}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailAddresses.trim()
  ? emailAddresses.split(",").map((email) => email.trim()).filter(Boolean)
  : ["keithsolo.sav@gmail.com"],

          subject: generateHeading(),
          html: `
            <h2>Guest Registration Completed</h2>
            <p><strong>Automated by:</strong> Tendai Nyevedzanai (BScHons CompScience, UCT)</p>
            <p><strong>Unit Number:</strong> ${unitNumber}</p>
            <h3>Guest Details:</h3>
            ${guests
              .map(
                (guest: any, i: number) => `
                  <div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #3B82F6;">
                    <strong>Guest ${i + 1}: ${guest.name}</strong><br>
                    ID Number: ${guest.idNumber}<br>
                    Contact: ${guest.contactNumber}<br>
                    Vehicle: ${guest.vehicleMake} (${guest.vehicleReg})<br>
                    Parking Bay: ${guest.parkingBay}<br>
                    Stay: ${guest.checkIn} to ${guest.checkOut} (${guest.duration})
                  </div>
                `
              )
              .join("")}
          `,
          attachments,
        }),
      });

      if (response.ok) {
        setCurrentStep("complete");
      } else {
        const errText = await response.text();
        throw new Error(errText || "Failed to send email");
      }
    } catch (error) {
      console.error("Error processing documents:", error);
      alert("Something went wrong while sending email. Check your backend config.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setCurrentStep("initial");
    setUnitNumber("");
    setGuestCount("");
    setGuests([]);
    setCurrentGuestIndex(0);
    setCurrentGuest({
      name: "",
      idNumber: "",
      contactNumber: "",
      vehicleMake: "",
      vehicleReg: "",
      parkingBay: "",
      checkIn: "",
      checkOut: "",
      duration: "",
      idDocument: null,
    });
    setPdfTemplate(null);
    setEmailAddresses("");
    setCustomHeading("");
    setIsProcessing(false);
  };

  const isCurrentGuestValid = () => {
    return (
      currentGuest.name?.trim() &&
      currentGuest.idNumber?.trim() &&
      currentGuest.contactNumber?.trim() &&
      currentGuest.checkIn &&
      currentGuest.checkOut &&
      currentGuest.idDocument
    );
  };

  const getCurrentDate = () => new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Automated Guest Submission </h1>
            <p className="text-[10px] font-medium text-blue-600 tracking-wide font-serif">
  by Tendai Nyevedzanai(LinkedIn)  <span className="text-blue-800">(BScHons CompScience, UCT)</span>
</p>
            <p className="text-gray-600">Automated guest information collection and document processing</p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span className={currentStep === "initial" ? "text-blue-600 font-medium" : ""}>Unit & Count</span>
              <span className={currentStep === "guestInfo" ? "text-blue-600 font-medium" : ""}>Guest Details</span>
              <span className={currentStep === "pdfUpload" ? "text-blue-600 font-medium" : ""}>PDF Upload</span>
              <span className={currentStep === "emailConfig" ? "text-blue-600 font-medium" : ""}>Email Setup</span>
              <span className={currentStep === "complete" ? "text-green-600 font-medium" : ""}>Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width:
                    currentStep === "initial"
                      ? "20%"
                      : currentStep === "guestInfo"
                      ? "40%"
                      : currentStep === "pdfUpload"
                      ? "60%"
                      : currentStep === "emailConfig"
                      ? "80%"
                      : "100%",
                }}
              />
            </div>
          </div>

          {currentStep === "initial" && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Welcome! Let's start the registration process</h2>
              <div className="max-w-sm mx-auto space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center justify-center text-sm font-medium text-gray-700">
                    <MapPin className="w-4 h-4 mr-2" />
                    Unit Number
                  </label>
                  <input
                    type="text"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    placeholder="Enter unit number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center justify-center text-sm font-medium text-gray-700">
                    <Users className="w-4 h-4 mr-2" />
                    Number of Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    placeholder="Enter number of guests"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleUnitAndGuestCountSubmit}
                  disabled={!guestCount || parseInt(guestCount) < 1 || !unitNumber.trim()}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {currentStep === "guestInfo" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Guest {currentGuestIndex + 1} of {guests.length} - Unit {unitNumber}
                </h2>
                <p className="text-gray-600">Please provide the following information:</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <User className="w-4 h-4 mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={currentGuest.name}
                    onChange={(e) => handleCurrentGuestChange("name", e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <CreditCard className="w-4 h-4 mr-2" />
                    ID/Passport Number *
                  </label>
                  <input
                    type="text"
                    value={currentGuest.idNumber}
                    onChange={(e) => handleCurrentGuestChange("idNumber", e.target.value)}
                    placeholder="Enter ID or passport number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    value={currentGuest.contactNumber}
                    onChange={(e) => handleCurrentGuestChange("contactNumber", e.target.value)}
                    placeholder="Enter contact number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Car className="w-4 h-4 mr-2" />
                    Vehicle Make & Model
                  </label>
                  <input
                    type="text"
                    value={currentGuest.vehicleMake}
                    onChange={(e) => handleCurrentGuestChange("vehicleMake", e.target.value)}
                    placeholder="e.g. Toyota Camry"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Vehicle Registration
                  </label>
                  <input
                    type="text"
                    value={currentGuest.vehicleReg}
                    onChange={(e) => handleCurrentGuestChange("vehicleReg", e.target.value)}
                    placeholder="Enter registration number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <MapPin className="w-4 h-4 mr-2" />
                    Parking Bay Number
                  </label>
                  <input
                    type="text"
                    value={currentGuest.parkingBay}
                    onChange={(e) => handleCurrentGuestChange("parkingBay", e.target.value)}
                    placeholder="Enter parking bay number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Calendar className="w-4 h-4 mr-2" />
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    value={currentGuest.checkIn}
                    onChange={(e) => handleCurrentGuestChange("checkIn", e.target.value)}
                    min={getCurrentDate()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Calendar className="w-4 h-4 mr-2" />
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    value={currentGuest.checkOut}
                    onChange={(e) => handleCurrentGuestChange("checkOut", e.target.value)}
                    min={currentGuest.checkIn || getCurrentDate()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {currentGuest.duration && (
                  <div className="md:col-span-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center text-blue-800">
                        <Clock className="w-5 h-5 mr-2" />
                        <span className="font-medium">Stay Duration: {currentGuest.duration}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="md:col-span-2 space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Camera className="w-4 h-4 mr-2" />
                    ID Document (PDF or Image) *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                    <label className="flex flex-col items-center justify-center cursor-pointer">
                      <FileText className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500 text-center">
                        Upload valid SA ID or Original Passport
                        <br />
                        (PDF, PNG, JPG accepted)
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleIdDocumentUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {currentGuest.idDocument && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center text-green-800">
                        <FileText className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">{currentGuest.idDocument.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={handlePrevGuest}
                  disabled={currentGuestIndex === 0}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextGuest}
                  disabled={!isCurrentGuestValid()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {currentGuestIndex === guests.length - 1 ? "Continue to PDF Upload" : "Next Guest"}
                </button>
              </div>
            </div>
          )}

          {currentStep === "pdfUpload" && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Upload className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Upload PDF Template</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Please upload the PDF template that will be filled with the guest information.
              </p>

              <div className="max-w-sm mx-auto">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileText className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">Click to upload PDF template</p>
                  </div>
                  <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                </label>
              </div>

              {pdfTemplate && (
                <div className="max-w-sm mx-auto bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center text-green-800">
                    <FileText className="w-5 h-5 mr-2" />
                    <span className="font-medium">{pdfTemplate.name}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === "emailConfig" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Email Configuration</h2>
                <p className="text-gray-600">Configure email settings for sending the completed documents.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Addresses (comma-separated) *
                  </label>
                  <textarea
                    value={emailAddresses}
                    onChange={(e) => setEmailAddresses(e.target.value)}
                    //placeholder="Enter recipient email addresses, separated by commas"
                    placeholder="Default Emails Entered:hpstobookings@gmail.com, hpbookings@icloud.com, hydroparkfm@gmail.com, hydroparkreception@gmail.com, vishaun.b.maharaj@icloud.com"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FileText className="w-4 h-4 mr-2" />
                    Custom Email Heading (optional)
                  </label>
                  <input
                    type="text"
                    value={customHeading}
                    onChange={(e) => setCustomHeading(e.target.value)}
                    placeholder="Leave blank for auto-generated heading"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500">Preview: "{generateHeading()}"</p>
                </div>

                <button
                  onClick={handleProcessDocuments}
                  disabled={isProcessing}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing Documents...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Process & Send Documents
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {currentStep === "complete" && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <div className="text-3xl">✓</div>
              </div>
              <h2 className="text-3xl font-bold text-green-600">Processing Complete!</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                The guest registration documents have been successfully processed and sent to the specified email addresses.
              </p>

              <div className="bg-gray-50 rounded-lg p-6 text-left max-w-2xl mx-auto">
                <h3 className="font-semibold text-gray-800 mb-4">Processing Summary:</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Unit Number: {unitNumber}</p>
                  <p>• Processed {guests.length} guest registration(s)</p>
                  <p>• PDF template: {pdfTemplate?.name}</p>
                  <p>• Email heading: "{generateHeading()}"</p>
                  <p>• Sent to: {emailAddresses.split(",").length} recipient(s)</p>
                  <p>• Date signed: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <button onClick={resetForm} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Start New Registration
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestRegistrationAgent;
