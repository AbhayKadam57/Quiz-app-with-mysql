import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { sendOTP, verifyOTP } from "@/api/authApi";
import { toast } from "sonner";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [mobileError, setMobileError] = useState(false);
  const [otpStatus, setOtpStatus] = useState(false);
  const [Loading, setLoading] = useState(false);
  const [otp, setOTP] = useState("");
  const [otpError, setOTPerror] = useState(false);
  const [step, setStep] = useState(1);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const validNumber = /^\d{0,10}$/.test(e.target.value);

    if (validNumber) {
      setMobile(e.target.value);
      setMobileError(false);
    } else {
      setMobileError(true);
    }
  };

  const handleOtpChange = (e) => {
    console.log(e);
    const validOTP = /^\d{0,6}$/.test(e);
    if (validOTP) {
      setOTP(e);
      setOTPerror(false);
    } else {
      setOTPerror(true);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();

    setLoading(true);

    if (!mobile) {
      setMobileError(true);
      setLoading(false);
      return;
    }
    try {
      const response = await sendOTP(mobile, name || null);

      setOtpStatus(true);

      if (response.success) {
        setOtpStatus(response.success);
        toast.success(response.message, { position: "top-center" });
      }
      setLoading(false);
      setStep(2);
    } catch (e) {
      console.log(e);
      toast.error(e.message, { position: "top-center" });
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!otp) {
      setOTPerror(true);
      return;
    }
    try {
      const response = await verifyOTP(mobile, otp);
      if (response.success) {
        setOTPerror(false);
        toast.success(response.message, { position: "top-center" });
      }

      setStep(1);
      setMobile("");
      setOTP("");
      setAuth(response.token, response.user);
      navigate("/start");
    } catch (e) {
      console.log(e);
      setOTPerror(true);
      toast.error(e?.response?.data?.message || e.message, {
        position: "top-center",
      });
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#e8ebea] font-[inter]">
      <div className="md:w-1/2 p-4 overflow-hidden rounded-md flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 p-2 flex flex-col gap-8">
          <div>
            <h1 className="text-[2rem] font-medium">Welcome back!</h1>
            <p>Ready to play? Start the quiz and show what you know!</p>
          </div>

          <form onSubmit={step == 1 ? handleSendOTP : handleVerifyOTP}>
            <FieldGroup>
              <Field>
                <FieldLabel>
                  Name <span className="text-gray-400 text-xs">(optional)</span>
                </FieldLabel>
                <Input
                  id="input-field-name"
                  type="text"
                  placeholder="Enter your name"
                  className="border border-[#2c8c72]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={otpStatus}
                />
              </Field>
              <Field>
                <FieldLabel>Mobile number</FieldLabel>
                <Input
                  id="input-field-mobile"
                  type="tel"
                  placeholder="Enter your mobile"
                  className="border border-[#2c8c72]"
                  value={mobile}
                  onChange={(e) => handleChange(e)}
                  aria-invalid={mobileError}
                />
                <p className="text-[12px] text-red-400">
                  {mobileError &&
                    "Please enter 10 digit valid mobile number e.g 9999999999"}
                </p>
              </Field>
              <Field className={`${otpStatus ? "block" : "hidden"}`}>
                <FieldLabel className="mb-2">One Time Pasword</FieldLabel>
                <InputOTP
                  value={otp}
                  onChange={handleOtpChange}
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                >
                  <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                    <InputOTPSlot
                      className="border border-[#2c8c72]"
                      index={0}
                    />
                    <InputOTPSlot
                      className="border border-[#2c8c72]"
                      index={1}
                    />
                    <InputOTPSlot
                      className="border border-[#2c8c72]"
                      index={2}
                    />
                    <InputOTPSlot
                      className="border border-[#2c8c72]"
                      index={3}
                    />
                    <InputOTPSlot
                      className="border border-[#2c8c72]"
                      index={4}
                    />
                    <InputOTPSlot
                      className="border border-[#2c8c72]"
                      index={5}
                    />
                  </InputOTPGroup>
                </InputOTP>
                <p className="text-[12px] text-red-400 mt-2">
                  {otpError === true && "Please enter a valid 6-digit OTP"}
                </p>
              </Field>
              <Field orientation="horizontal">
                <Button type="submit">
                  {otpStatus ? "Submit OTP" : "Get OTP"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </div>
        <div className="flex-1 flex h-[20%] md:h-full flex-col p-2">
          <img
            src="/Login.png"
            className="bg-[#2c8c72] h-full md:h-[30%] rounded-t-md p-5 object-contain"
            alt=""
          />
          <div className="flex-1 bg-black flex items-start p-5 rounded-b-md flex-col">
            <h2 className="text-white text-[1.5rem] md:text-[2.5rem] font-bold">
              Get Started
            </h2>
            <h2 className="text-white text-[1.5rem] md:text-[2.5rem] font-bold">
              with exciting quizes
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
