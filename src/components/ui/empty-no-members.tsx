import { UsersIcon } from "lucide-react";
import { m } from "@/paraglide/messages";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";

export function EmptyNoMembers() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UsersIcon />
        </EmptyMedia>
        <EmptyTitle>{m.empty_no_members_title()}</EmptyTitle>
        <EmptyDescription>{m.empty_no_members_description()}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
