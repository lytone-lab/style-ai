"use client";

import { FormEvent, useState } from "react";

type FormStatus = "idle" | "submitting" | "success" | "error";
type WaitlistResponse = { message?: string; error?: string };

function isWaitlistResponse(value: unknown): value is WaitlistResponse {
  return typeof value === "object" && value !== null;
}

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const errorMessage =
          isWaitlistResponse(payload) &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Something went wrong. Please try again.";
        setStatus("error");
        setMessage(errorMessage);
        return;
      }

      setStatus("success");
      setMessage(
        isWaitlistResponse(payload) &&
          "message" in payload &&
          typeof payload.message === "string"
          ? payload.message
          : "You’re on the list. We’ll be in touch.",
      );
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("We couldn’t reach the server. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="waitlist-success" role="status" aria-live="polite">
        <span className="waitlist-success-mark" aria-hidden="true">✓</span>
        <span>
          <strong>You’re on the list.</strong>
          <span>{message}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="waitlist-wrap">
      <form className="waitlist-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="waitlist-email">Email address</label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Your email address"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status === "error") {
              setStatus("idle");
              setMessage("");
            }
          }}
          required
          maxLength={254}
          disabled={status === "submitting"}
          aria-describedby="waitlist-message"
        />
        <button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Joining..." : "Get early access"}
          <span aria-hidden="true">↗</span>
        </button>
      </form>
      <p
        id="waitlist-message"
        className={`form-message${status === "error" ? " form-message-error" : ""}`}
        role={status === "error" ? "alert" : "status"}
        aria-live="polite"
      >
        {message || "A little note when we’re ready. No noise, ever."}
      </p>
    </div>
  );
}
