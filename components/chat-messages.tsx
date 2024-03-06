import { Sparkles, User } from "lucide-react";

export const UserMessage: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="p-4 flex border-b [&>*:last-child]:border-none">
      <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-800 mr-4 flex-shrink-0 flex items-center justify-center">
        <User size="20" />
      </div>
      <div>{children}</div>
    </div>
  );
};

export const AssistantMessage: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="p-4 flex border-b [&>*:last-child]:border-none">
      <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-800 mr-4 flex-shrink-0 flex items-center justify-center">
        <Sparkles size="20" />
      </div>
      <div>{children}</div>
    </div>
  );
};
