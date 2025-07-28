import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, Copy, Settings, Users } from "lucide-react";
import React, { useState } from "react";
import { deleteGroup, updateGroup } from "../../api/groups";
import type { GroupMembership, GroupWithMembers } from "../../types";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { GroupSettingsModal } from "./GroupSettingsModal";

interface GroupCardProps {
  group: GroupWithMembers & { currentUserMembership: GroupMembership };
  onGroupClick: (groupId: string) => void;
  onGroupUpdate?: () => void; // 그룹 업데이트 후 새로고침용
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onGroupClick,
  onGroupUpdate,
}) => {
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(group.invite_code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("클립보드 복사 실패:", err);
    }
  };

  const handleGroupUpdate = async (
    groupId: string,
    data: { name: string; description?: string }
  ) => {
    await updateGroup(groupId, data);
    onGroupUpdate?.(); // 부모 컴포넌트에서 데이터 새로고침
  };

  const handleGroupDelete = async (groupId: string) => {
    await deleteGroup(groupId);
    onGroupUpdate?.(); // 부모 컴포넌트에서 데이터 새로고침
  };

  const roleDisplayName = {
    owner: "소유자",
    admin: "관리자",
    member: "멤버",
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onGroupClick(group.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-1">
              {group.name}
            </CardTitle>
            {group.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {group.description}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-1 ml-2">
            {(group.currentUserMembership.role === "owner" ||
              group.currentUserMembership.role === "admin") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(true);
                }}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* 멤버 수와 역할 */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>멤버 수: {group.member_count}명</span>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {roleDisplayName[group.currentUserMembership.role]}
            </span>
          </div>

          {/* 참여 날짜 */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(
                new Date(group.currentUserMembership.joined_at),
                "yyyy년 MM월 dd일 참여",
                { locale: ko }
              )}
            </span>
          </div>

          {/* 초대 코드 (소유자/관리자만) */}
          {(group.currentUserMembership.role === "owner" ||
            group.currentUserMembership.role === "admin") && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInviteCode(!showInviteCode);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showInviteCode ? "초대 코드 숨기기" : "초대 코드 보기"}
                </button>
                {showInviteCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyInviteCode();
                    }}
                    className="h-7 px-2"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copySuccess ? "복사됨!" : "복사"}
                  </Button>
                )}
              </div>
              {showInviteCode && (
                <div className="mt-2 p-2 bg-gray-50 rounded font-mono text-sm break-all">
                  {group.invite_code}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* 그룹 설정 모달 */}
      <GroupSettingsModal
        group={group}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onUpdate={handleGroupUpdate}
        onDelete={handleGroupDelete}
      />
    </Card>
  );
};
