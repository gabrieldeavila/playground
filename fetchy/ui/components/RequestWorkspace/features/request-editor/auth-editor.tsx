import { memo } from "react";
import { FiGlobe } from "react-icons/fi";

import { EmptyState } from "@/ui/components/primitives/empty-state";
import { Input } from "@/ui/components/primitives/input";
import { Select } from "@/ui/components/primitives/select";
import { REQUEST_AUTH_OPTIONS } from "@/types/consts/request-auth.const";
import type { RequestAuth } from "@/types/interface/request.interface";

type AuthEditorProps = {
  auth: RequestAuth;
  onChange: (auth: RequestAuth) => void;
};

export const AuthEditor = memo(function AuthEditor({
  auth,
  onChange,
}: AuthEditorProps) {
  return (
    <div className="space-y-4">
      <Select
        label="Authentication type"
        value={auth.type}
        onChange={(event) => {
          const type = event.target.value as RequestAuth["type"];
          onChange(
            type === "bearer"
              ? { type, token: "" }
              : type === "apiKey"
                ? { type, key: "", value: "", placement: "header" }
                : { type: "none" },
          );
        }}
      >
        {REQUEST_AUTH_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {auth.type === "bearer" && (
        <Input
          label="Bearer token"
          value={auth.token}
          onChange={(event) => onChange({ ...auth, token: event.target.value })}
          placeholder="{{accessToken}}"
          className="font-mono text-xs"
        />
      )}
      {auth.type === "apiKey" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Key"
            value={auth.key}
            onChange={(event) => onChange({ ...auth, key: event.target.value })}
            placeholder="X-API-Key"
            className="font-mono text-xs"
          />
          <Input
            label="Value"
            value={auth.value}
            onChange={(event) =>
              onChange({ ...auth, value: event.target.value })
            }
            placeholder="{{apiKey}}"
            className="font-mono text-xs"
          />
          <Select
            label="Add to"
            value={auth.placement}
            onChange={(event) =>
              onChange({
                ...auth,
                placement: event.target.value as "header" | "query",
              })
            }
          >
            <option value="header">Header</option>
            <option value="query">Query parameter</option>
          </Select>
        </div>
      )}
      {auth.type === "none" && (
        <EmptyState
          icon={<FiGlobe />}
          title="No authentication configured"
          description="Choose an authentication strategy to configure this request."
        />
      )}
    </div>
  );
});
