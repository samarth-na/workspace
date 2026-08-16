import { Plus } from "pixelarticons/react";
import { Button } from "@/components/ui/button";

function ViewFrame({
  title,
  description,
  action,
  onAction,
  children,
}: {
  title: string;
  description: string;
  action: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-[30px] font-semibold tracking-[-0.045em] text-[#20293c]">
            {title}
          </h1>
          <p className="mt-2 text-[14px] text-[#788193]">{description}</p>
        </div>
        <Button
          className="h-9 w-fit bg-[#5b64d6] px-3 text-[12px] font-semibold hover:bg-[#4e57c5]"
          onClick={onAction}
        >
          <Plus className="size-3.5" /> {action}
        </Button>
      </div>
      {children}
    </section>
  );
}

export { ViewFrame };
