import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { ActivityItem } from "@/lib/types";
import { getUserById } from "@/lib/data";
import { Circle, UserCheck, Tag, FileText } from "lucide-react";

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

const activityIcons: Record<ActivityItem["type"], typeof Circle> = {
  status_change: Circle,
  assignment: UserCheck,
  tag_added: Tag,
  note_added: FileText,
};

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) return null;

  return (
    <div className="space-y-3 py-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Activity
      </h3>
      
      <div className="space-y-3">
        {activities.map((activity) => {
          const actor = getUserById(activity.actorId);
          const Icon = activityIcons[activity.type];
          
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3"
            >
              <div className="flex-shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{actor?.name || "Unknown"}</span>{" "}
                  <span className="text-muted-foreground">{activity.description}</span>
                </p>
                
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
