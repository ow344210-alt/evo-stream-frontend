import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SocialButtons } from "@/components/video/SocialButtons";

describe("SocialButtons", () => {
  it("renders real counts", () => {
    render(
      <SocialButtons
        likeCount={1234}
        commentCount={5}
        shareCount={2}
        followerCount={1500}
        isLiked={false}
        isSaved={false}
        isFollowing={false}
        pendingAction={null}
        onLike={vi.fn()}
        onSave={vi.fn()}
        onShare={vi.fn()}
        onFollow={vi.fn()}
        onComments={vi.fn()}
        commentsOpen={false}
      />,
    );
    expect(screen.getByLabelText("Like")).toHaveTextContent("1.2k");
    expect(screen.getByLabelText("Share")).toHaveTextContent("2");
    expect(screen.getByLabelText("Comments")).toHaveTextContent("Comments · 5");
    expect(screen.getByLabelText("Follow hub")).toHaveTextContent("1.5k");
  });

  it("shows active state when liked and toggles label to Unlike", () => {
    render(
      <SocialButtons
        likeCount={3}
        commentCount={0}
        shareCount={0}
        followerCount={0}
        isLiked={true}
        isSaved={false}
        isFollowing={false}
        pendingAction={null}
        onLike={vi.fn()}
        onSave={vi.fn()}
        onShare={vi.fn()}
        onFollow={vi.fn()}
        onComments={vi.fn()}
        commentsOpen={false}
      />,
    );
    const like = screen.getByLabelText("Unlike");
    expect(like).toHaveAttribute("aria-pressed", "true");
  });

  it("invokes the correct handlers on click", () => {
    const onLike = vi.fn();
    const onSave = vi.fn();
    const onShare = vi.fn();
    const onFollow = vi.fn();
    const onComments = vi.fn();
    render(
      <SocialButtons
        likeCount={1}
        commentCount={0}
        shareCount={0}
        followerCount={1}
        isLiked={false}
        isSaved={false}
        isFollowing={false}
        pendingAction={null}
        onLike={onLike}
        onSave={onSave}
        onShare={onShare}
        onFollow={onFollow}
        onComments={onComments}
        commentsOpen={false}
      />,
    );
    fireEvent.click(screen.getByLabelText("Like"));
    fireEvent.click(screen.getByLabelText("Save to My List"));
    fireEvent.click(screen.getByLabelText("Share"));
    fireEvent.click(screen.getByLabelText("Follow hub"));
    fireEvent.click(screen.getByLabelText("Comments"));
    expect(onLike).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(onFollow).toHaveBeenCalledTimes(1);
    expect(onComments).toHaveBeenCalledTimes(1);
  });

  it("disables all buttons while a mutation is pending (prevents duplicate clicks)", () => {
    render(
      <SocialButtons
        likeCount={1}
        commentCount={0}
        shareCount={0}
        followerCount={1}
        isLiked={false}
        isSaved={false}
        isFollowing={false}
        pendingAction="like"
        onLike={vi.fn()}
        onSave={vi.fn()}
        onShare={vi.fn()}
        onFollow={vi.fn()}
        onComments={vi.fn()}
        commentsOpen={false}
      />,
    );
    expect(screen.getByLabelText("Like")).toBeDisabled();
    expect(screen.getByLabelText("Save to My List")).toBeDisabled();
    expect(screen.getByLabelText("Share")).toBeDisabled();
    expect(screen.getByLabelText("Follow hub")).toBeDisabled();
  });

  it("hides the follower count when it is null", () => {
    render(
      <SocialButtons
        likeCount={1}
        commentCount={0}
        shareCount={0}
        followerCount={null}
        isLiked={false}
        isSaved={false}
        isFollowing={false}
        pendingAction={null}
        onLike={vi.fn()}
        onSave={vi.fn()}
        onShare={vi.fn()}
        onFollow={vi.fn()}
        onComments={vi.fn()}
        commentsOpen={false}
      />,
    );
    expect(screen.getByLabelText("Follow hub")).not.toHaveTextContent("·");
  });
});
