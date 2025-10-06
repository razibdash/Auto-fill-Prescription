// PrescriptionRecorder.jsx
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { MdOutlineKeyboardVoice, MdVoiceOverOff } from "react-icons/md";
export default function PrescriptionRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);
  const [prescription, setPrescription] = useState({
    patientName: "",
    patientAge: "",
    patientWeight: "",
    diagnosis: "",
    medications: [], // {name, dose, frequency, duration, notes}
    instructions: "",
  });
  const [waveHeights] = useState([4, 6, 8, 6, 4]);
  const [country, setCountry] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  async function startRecording() {
    setTranscription("");
    setPrescription({
      patientName: "",
      patientAge: "",
      patientWeight: "",
      diagnosis: "",
      medications: [],
      instructions: "",
    });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.addEventListener("dataavailable", (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    });

    mediaRecorder.addEventListener("stop", async () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      setAudioUrl(URL.createObjectURL(blob));
      await uploadAudio(blob);
    });

    mediaRecorder.start();
    setRecording(true);
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  async function uploadAudio(blob) {
    setLoading(true);
    // https://auto-fill-prescription.onrender.com
    try {
      const fd = new FormData();
      fd.append("audio", blob, "speech.webm");
      fd.append("country", country);
      console.log(fd);
      const res = await fetch(
        "https://auto-fill-prescription.onrender.com/api/transcribe",
        {
          method: "POST",
          body: fd,
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Transcription failed");
      }

      const data = await res.json();
      console.log("Transcription response:", data);
      setTranscription(data.transcription || "");
      if (data.prescription) setPrescription(data.prescription);
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateMedication(idx, field, value) {
    const meds = [...prescription.medications];
    meds[idx] = { ...meds[idx], [field]: value };
    setPrescription({ ...prescription, medications: meds });
  }

  function addMedication() {
    setPrescription({
      ...prescription,
      medications: [
        ...prescription.medications,
        { name: "", dose: "", frequency: "", duration: "", notes: "" },
      ],
    });
  }
  function removeMedication(idx) {
    const meds = [...prescription.medications];
    meds.splice(idx, 1);
    setPrescription({ ...prescription, medications: meds });
  }
  const handleCountryChange = (event) => {
    const selectedCountry = event.target.value;
    setCountry(selectedCountry);
    console.log("Selected Country:", selectedCountry);
  };
  console.log(transcription, prescription);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Prescription Recorder
        </h2>
        <div className="flex flex-col gap-2 w-64">
          <label
            htmlFor="country"
            className="text-sm font-medium text-gray-400"
          >
            Choose a Country:
          </label>

          <select
            id="country"
            value={country}
            onChange={handleCountryChange}
            className="p-2 border rounded-md focus:ring-2 bg-stone-800 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">-- Select Country --</option>
            <option value="Bangladesh">Bangladesh</option>
            <option value="India">India</option>
            <option value="Japan">Japan</option>
            <option value="China">China</option>
          </select>

          {country && (
            <p className="text-sm text-gray-600">
              You selected: <span className="font-semibold">{country}</span>
            </p>
          )}
        </div>
      </div>
      {/* 🎤 Record Button */}
      <div className="mb-6 flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          {/* 🔵 Pulsing Mic Glow */}
          {recording && (
            <motion.div
              className="absolute rounded-full bg-blue-400/40"
              style={{ width: 80, height: 80 }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}

          {/* 🎙️ Mic Button */}
          {!recording ? (
            <button
              onClick={startRecording}
              className="relative z-10 flex items-center justify-center w-16 h-16 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition"
            >
              <MdOutlineKeyboardVoice className="text-3xl" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="relative z-10 flex items-center justify-center w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition"
            >
              <MdVoiceOverOff className="text-3xl" />
            </button>
          )}
        </div>

        {/* 🔊 Recording Animation */}
        {recording && (
          <div className="flex items-end justify-center h-6 mt-6 space-x-1">
            {waveHeights.map((h, i) => (
              <motion.div
                key={i}
                className="w-1 bg-blue-500 rounded"
                animate={{
                  height: [h, h * 2, h, h * 1.5, h],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        )}

        {/* 🎧 Recording Status */}
        <span className="mt-2 text-sm text-gray-600">
          {recording ? "Listening..." : ""}
        </span>
      </div>

      {/* 🎵 Audio Player */}
      {audioUrl && (
        <div className="mb-4">
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}

      {/* ⏳ Loading Text */}
      {loading && (
        <div className="mb-4 text-sm text-blue-600 animate-pulse">
          Processing... please wait.
        </div>
      )}

      {/* 🧾 Transcription Output */}
      {transcription && (
        <div className="mb-4 p-4 bg-gray-900 text-gray-100 rounded-lg border border-gray-700 shadow">
          <h3 className="font-semibold mb-2">Transcription</h3>
          <p className="text-sm leading-relaxed">{transcription}</p>
        </div>
      )}

      <form className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={prescription.patientName}
            onChange={(e) =>
              setPrescription({ ...prescription, patientName: e.target.value })
            }
            className="p-2 border rounded"
            placeholder="Patient name"
          />
          <input
            value={prescription.patientAge}
            onChange={(e) =>
              setPrescription({ ...prescription, patientAge: e.target.value })
            }
            className="p-2 border rounded"
            placeholder="Age"
          />
          <input
            value={prescription.patientWeight}
            onChange={(e) =>
              setPrescription({
                ...prescription,
                patientWeight: e.target.value,
              })
            }
            className="p-2 border rounded"
            placeholder="Weight (kg)"
          />
        </div>

        <div>
          <textarea
            value={prescription.diagnosis}
            onChange={(e) =>
              setPrescription({ ...prescription, diagnosis: e.target.value })
            }
            className="w-full p-2 border rounded"
            placeholder="Diagnosis"
            rows="2"
          />
        </div>

        <div>
          <h4 className="font-medium mb-2">Medications</h4>
          {prescription.medications.map((med, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2">
              <input
                value={med.name}
                onChange={(e) => updateMedication(i, "name", e.target.value)}
                className="p-2 border rounded"
                placeholder="Name"
              />
              <input
                value={med.dose}
                onChange={(e) => updateMedication(i, "dose", e.target.value)}
                className="p-2 border rounded"
                placeholder="Dose (e.g., 500 mg)"
              />
              <input
                value={med.frequency}
                onChange={(e) =>
                  updateMedication(i, "frequency", e.target.value)
                }
                className="p-2 border rounded"
                placeholder="Frequency (e.g., twice daily)"
              />
              <input
                value={med.duration}
                onChange={(e) =>
                  updateMedication(i, "duration", e.target.value)
                }
                className="p-2 border rounded"
                placeholder="Duration (e.g., 5 days)"
              />
              <input
                value={med.notes}
                onChange={(e) => updateMedication(i, "notes", e.target.value)}
                className="p-2 border rounded"
                placeholder="Notes"
              />
              <button
                type="button"
                onClick={() => removeMedication(i)}
                className="px-2 py-1 bg-red-600 text-white rounded"
              >
                Remove
              </button>
            </div>
          ))}

          <div>
            <button
              type="button"
              onClick={addMedication}
              className="px-3 py-1 bg-blue-600 text-stone-200 shadow cursor-pointer rounded"
            >
              Add medication
            </button>
          </div>
        </div>

        <div>
          <textarea
            value={prescription.instructions}
            onChange={(e) =>
              setPrescription({ ...prescription, instructions: e.target.value })
            }
            className="w-full p-2 border rounded"
            placeholder="Patient instructions"
            rows="3"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save Prescription
          </button>
          <button type="button" className="px-4 py-2 border rounded">
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
