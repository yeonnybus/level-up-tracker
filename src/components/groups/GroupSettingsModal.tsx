import {
  AlertTriangle,
  Copy,
  Crown,
  Settings,
  Shield,
  Trash2,
  Users,
  UserX,
} from "lucide-react";
import React, { useState } from "react";
import {
  changeGroupMemberRole,
  removeGroupMember,
  transferGroupOwnership,
} from "../../api/groups";
import type { GroupMembership, GroupWithMembers, User } from "../../types";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

interface GroupSettingsModalProps {
  group: (GroupWithMembers & { currentUserMembership: GroupMembership }) | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    groupId: string,
    data: { name: string; description?: string }
  ) => Promise<void>;
  onDelete: (groupId: string) => Promise<void>;
}

export const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({
  group,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "members" | "danger">(
    "general"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    name: group?.name || "",
    description: group?.description || "",
  });

  // 삭제 확인 상태
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 소유권 양도 상태
  const [showTransferOwnership, setShowTransferOwnership] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState("");

  // 멤버 관리 상태
  const [members, setMembers] = useState<
    (GroupMembership & {
      user: Pick<User, "id" | "full_name" | "username" | "avatar_url">;
    })[]
  >([]);
  const [membersLoading, setMembersLoading] = useState(false);

  React.useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || "",
      });
    }
  }, [group]);

  // 멤버 데이터 로드
  const loadMembers = React.useCallback(async () => {
    if (!group || activeTab !== "members") return;

    try {
      setMembersLoading(true);
      // getGroupDetails API를 사용하여 멤버 정보 가져오기
      const { getGroupDetails } = await import("../../api/groups");
      const groupDetails = await getGroupDetails(group.id);
      setMembers(groupDetails.memberships || []);
    } catch (error) {
      console.error("멤버 목록 로딩 실패:", error);
    } finally {
      setMembersLoading(false);
    }
  }, [group, activeTab]);

  // 멤버 탭이 활성화될 때 데이터 로드
  React.useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  if (!group) return null;

  const isOwner = group.currentUserMembership.role === "owner";
  const canManage = isOwner || group.currentUserMembership.role === "admin";

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onUpdate(group.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error("그룹 업데이트 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(group.invite_code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("클립보드 복사 실패:", err);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== group.name) return;

    try {
      setIsLoading(true);
      await onDelete(group.id);
      onClose();
    } catch (error) {
      console.error("그룹 삭제 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 멤버 역할 변경
  const handleChangeRole = async (
    userId: string,
    newRole: "admin" | "member"
  ) => {
    try {
      setIsLoading(true);
      await changeGroupMemberRole(group.id, userId, newRole);
      await loadMembers(); // 멤버 목록 새로고침
    } catch (error) {
      console.error("역할 변경 실패:", error);
      alert(
        error instanceof Error ? error.message : "역할 변경에 실패했습니다"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 멤버 추방
  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`정말로 "${userName}"님을 그룹에서 추방하시겠습니까?`)) return;

    try {
      setIsLoading(true);
      await removeGroupMember(group.id, userId);
      await loadMembers(); // 멤버 목록 새로고침
    } catch (error) {
      console.error("멤버 추방 실패:", error);
      alert(
        error instanceof Error ? error.message : "멤버 추방에 실패했습니다"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 소유권 양도
  const handleTransferOwnership = async () => {
    if (!selectedNewOwner) return;

    const newOwner = members.find((m) => m.user_id === selectedNewOwner);
    const newOwnerName =
      newOwner?.user.full_name || newOwner?.user.username || "사용자";

    if (
      !confirm(
        `정말로 "${newOwnerName}"님에게 그룹 소유권을 양도하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
      )
    )
      return;

    try {
      setIsLoading(true);
      await transferGroupOwnership(group.id, selectedNewOwner);
      alert("소유권이 성공적으로 양도되었습니다.");
      onClose(); // 모달 닫기 (권한이 변경되었으므로)
    } catch (error) {
      console.error("소유권 양도 실패:", error);
      alert(
        error instanceof Error ? error.message : "소유권 양도에 실패했습니다"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "general" as const, label: "일반", icon: Settings },
    { id: "members" as const, label: "멤버", icon: Users },
    ...(isOwner
      ? [{ id: "danger" as const, label: "위험", icon: AlertTriangle }]
      : []),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            그룹 설정
          </DialogTitle>
          <DialogDescription>
            {group.name} 그룹의 설정을 관리합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* 탭 네비게이션 */}
          <div className="flex border-b mb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 탭 콘텐츠 */}
          <div className="overflow-y-auto max-h-96">
            {activeTab === "general" && (
              <div className="space-y-4">
                {/* 기본 정보 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">기본 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="groupName">그룹 이름</Label>
                      <Input
                        id="groupName"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="그룹 이름을 입력하세요"
                        disabled={!canManage}
                      />
                    </div>
                    <div>
                      <Label htmlFor="groupDescription">설명 (선택사항)</Label>
                      <Textarea
                        id="groupDescription"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="그룹에 대한 설명을 입력하세요"
                        disabled={!canManage}
                        rows={3}
                      />
                    </div>
                    {canManage && (
                      <div className="flex justify-end">
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSave();
                          }}
                          disabled={isLoading}
                        >
                          {isLoading ? "저장 중..." : "저장"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 초대 코드 */}
                {canManage && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">초대 코드</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 p-3 bg-gray-50 rounded font-mono text-sm break-all">
                          {group.invite_code}
                        </div>
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            copyInviteCode();
                          }}
                          className="shrink-0"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          {copySuccess ? "복사됨!" : "복사"}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        이 코드를 공유하여 다른 사용자를 그룹에 초대할 수
                        있습니다.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "members" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">멤버 관리</CardTitle>
                </CardHeader>
                <CardContent>
                  {membersLoading ? (
                    <div className="text-center py-8 text-gray-500">
                      멤버 목록을 불러오는 중...
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      멤버가 없습니다
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {members.map((member) => {
                        const displayName =
                          member.user.full_name ||
                          member.user.username ||
                          "사용자";
                        const canChangeRole =
                          isOwner && member.role !== "owner";
                        const canRemove =
                          (isOwner ||
                            group.currentUserMembership.role === "admin") &&
                          member.role !== "owner" &&
                          member.user_id !==
                            group.currentUserMembership.user_id;

                        return (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                {member.user.avatar_url ? (
                                  <img
                                    src={member.user.avatar_url}
                                    alt={displayName}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-medium text-gray-600">
                                    {displayName[0].toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{displayName}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                  {member.role === "owner" && (
                                    <>
                                      <Crown className="h-3 w-3 text-yellow-500" />
                                      <span>소유자</span>
                                    </>
                                  )}
                                  {member.role === "admin" && (
                                    <>
                                      <Shield className="h-3 w-3 text-blue-500" />
                                      <span>관리자</span>
                                    </>
                                  )}
                                  {member.role === "member" && (
                                    <span>멤버</span>
                                  )}
                                  <span>•</span>
                                  <span>
                                    {new Date(
                                      member.joined_at
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {(canChangeRole || canRemove) && (
                              <div className="flex items-center gap-2">
                                {canChangeRole && (
                                  <Select
                                    value={member.role}
                                    onValueChange={(value) => {
                                      if (
                                        !isLoading &&
                                        (value === "admin" ||
                                          value === "member")
                                      ) {
                                        handleChangeRole(member.user_id, value);
                                      }
                                    }}
                                  >
                                    <SelectTrigger
                                      className="w-28"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">
                                        관리자
                                      </SelectItem>
                                      <SelectItem value="member">
                                        멤버
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                                {canRemove && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleRemoveMember(
                                        member.user_id,
                                        displayName
                                      );
                                    }}
                                    disabled={isLoading}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "danger" && isOwner && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    위험한 작업
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 소유권 양도 */}
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-medium text-orange-800 mb-2">
                      소유권 양도
                    </h4>
                    <p className="text-sm text-orange-700 mb-4">
                      다른 멤버에게 그룹 소유권을 양도할 수 있습니다. 양도
                      후에는 관리자 권한으로 변경됩니다.
                    </p>

                    {!showTransferOwnership ? (
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowTransferOwnership(true);
                        }}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        소유권 양도
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="newOwner">새 소유자 선택</Label>
                          <Select
                            value={selectedNewOwner}
                            onValueChange={setSelectedNewOwner}
                          >
                            <SelectTrigger
                              className="border-orange-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue placeholder="새 소유자를 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                              {members
                                .filter((m) => m.role !== "owner")
                                .map((member) => {
                                  const displayName =
                                    member.user.full_name ||
                                    member.user.username ||
                                    "사용자";
                                  return (
                                    <SelectItem
                                      key={member.user_id}
                                      value={member.user_id}
                                    >
                                      {displayName} (
                                      {member.role === "admin"
                                        ? "관리자"
                                        : "멤버"}
                                      )
                                    </SelectItem>
                                  );
                                })}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowTransferOwnership(false);
                              setSelectedNewOwner("");
                            }}
                          >
                            취소
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleTransferOwnership();
                            }}
                            disabled={!selectedNewOwner || isLoading}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            {isLoading ? "양도 중..." : "소유권 양도"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 그룹 삭제 */}
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">그룹 삭제</h4>
                    <p className="text-sm text-red-700 mb-4">
                      그룹을 삭제하면 모든 데이터가 영구적으로 삭제되며, 이
                      작업은 되돌릴 수 없습니다. 그룹 삭제를 확인하려면 그룹
                      이름을 정확히 입력하세요.
                    </p>

                    {!showDeleteConfirm ? (
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowDeleteConfirm(true);
                        }}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        그룹 삭제
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="deleteConfirm">
                            그룹 이름 입력: <strong>{group.name}</strong>
                          </Label>
                          <Input
                            id="deleteConfirm"
                            value={deleteConfirmation}
                            onChange={(e) =>
                              setDeleteConfirmation(e.target.value)
                            }
                            placeholder={group.name}
                            className="border-red-300"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowDeleteConfirm(false);
                              setDeleteConfirmation("");
                            }}
                          >
                            취소
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete();
                            }}
                            disabled={
                              deleteConfirmation !== group.name || isLoading
                            }
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isLoading ? "삭제 중..." : "삭제 확인"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
