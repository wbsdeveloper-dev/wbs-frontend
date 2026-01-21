"use client";
// import { useEffect, useState } from "react";
// import { QRCodeCanvas } from "qrcode.react";
// import { Button } from "@mui/material";

export default function WhatsappBot() {
  // const [qr, setQr] = useState("");
  // const [agent1Info, setAgent1Info] = useState({
  //   type: localStorage.getItem("agent_id") || "",
  //   name: localStorage.getItem("agent_name") || "",
  //   id: localStorage.getItem("agent_id") || "",
  //   groupList: [],
  // });

  // useEffect(() => {
  //   const isAlreadyConnected = localStorage.getItem("wa_connected") === "true";

  //   if (!isAlreadyConnected) {
  //     const ws = new WebSocket("ws://localhost:8080");

  //     ws.onmessage = (event) => {
  //       const data = JSON.parse(event.data);

  //       setAgent1Info(data);

  //       console.log("data agent", data);

  //       if (data.type === "qr") {
  //         setQr(data.qr);
  //       }

  //       if (data.type === "connected") {
  //         localStorage.setItem("agent_name", JSON.stringify(data.name));
  //         localStorage.setItem("agent_id", JSON.stringify(data.id));
  //         localStorage.setItem("agent_status", JSON.stringify(data.type));
  //         localStorage.setItem(
  //           "agent_group",
  //           JSON.stringify(data.groupList[0].name)
  //         );
  //         localStorage.setItem("wa_connected", "true");
  //         alert("WhatsApp connected!");
  //       }
  //     };

  //     return () => ws.close();
  //   }
  // }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Whatsapp Bot</h1>
            <p className="text-gray-600 mt-1">
              Configure your whatsapp bot settings
            </p>
          </div>
          <div className="mb-8">
            {localStorage.getItem("agent_name") && (
              <div className="grid grid-cols-1 gap-4 mb-6 bg-white text-gray-600 border border-gray-200 rounded-xl p-6 w-[50%]">
                <div className="flex">
                  <p className="w-[120px]">Status</p>
                  <p className="capitalize flex items-center gap-1 font-bold">
                    :
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                    {agent1Info.type}
                  </p>
                </div>
                <div className="flex">
                  <p className="w-[120px]">Agent Name</p>
                  <p className="font-bold">: {agent1Info.name}</p>
                </div>
                <div className="flex">
                  <p className="w-[120px]">Agent ID</p>
                  <p className="font-bold">: {agent1Info.id}</p>
                </div>
                <div className="flex">
                  <p className="w-[120px]">Active Groups</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="contained">Refresh Connection</Button>
                  <Button variant="outlined" color="error">
                    Disconnect
                  </Button>
                </div>
              </div>
            )}
            {!agent1Info.name && (
              <div className="grid grid-cols-2 gap-4 mb-6 bg-white text-gray-600 border border-gray-200 rounded-xl p-6 w-[50%]">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Welcome to WBS Bot Configuration
                  </h3>
                  <p className="mt-3">
                    Manage your WhatsApp Bot settings here. Configure login,
                    sessions, and bot preferences to ensure continuous and
                    reliable performance.
                  </p>
                  <div>
                    <h3 className="text-md font-bold text-gray-900 mt-4">
                      Step to log in
                    </h3>
                    <ul className="mt-2">
                      <li>
                        1. Open <b>WhatsApp</b> on your phone
                      </li>
                      <li>
                        2. On Android tap <b>Menu</b>. On iPhone tap{" "}
                        <b>Settings</b>
                      </li>
                      <li>
                        3. Tap <b>Linked devices</b>, then <b>Link device</b>
                      </li>
                      <li>4. Scan the QR code to confirm</li>
                    </ul>
                  </div>
                </div>
                <div className="flex justify-center items-center">
                  {qr ? (
                    <div className="flex flex-col justify-center items-center gap-2">
                      <QRCodeCanvas value={qr} size={210} />
                      <p>Scan This QRCode</p>
                    </div>
                  ) : (
                    <p>Waiting for QR...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main> */}
    </div>
  );
}
