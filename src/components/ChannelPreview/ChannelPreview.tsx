import React, { useEffect, useState } from 'react';

import { ChannelPreviewCountOnly } from './ChannelPreviewCountOnly';
import { getDisplayImage, getDisplayTitle, getLatestMessagePreview } from './utils';

import { ChatContextValue, useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { Channel, Event } from 'stream-chat';

import type { AvatarProps } from '../Avatar/Avatar';

import type { StreamMessage } from '../../context/ChannelContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export type ChannelPreviewUIComponentProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us> & {
  /** If the component's channel is the active (selected) Channel */
  active?: boolean;
  /** Image of Channel to display */
  displayImage?: string;
  /** Title of Channel to display */
  displayTitle?: string;
  /** The last message received in a channel */
  lastMessage?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  /** Latest message preview text to display */
  latestMessage?: string;
  /** Text truncation limit for latest message */
  latestMessageLength?: number;
  /** Number of unread Messages */
  unread?: number;
};

export type ChannelPreviewProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  /** Comes from either the `channelRenderFilterFn` or `usePaginatedChannels` call from [ChannelList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelList/ChannelList.tsx) */
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  /** Current selected channel object */
  activeChannel?: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  /**
   * Custom UI component to display user avatar
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx)
   */
  Avatar?: React.ComponentType<AvatarProps>;
  /** Forces the update of preview component on channel update */
  channelUpdateCount?: number;
  key?: string;
  /**
   * Available built-in options (also accepts the same props as):
   *
   * 1. [ChannelPreviewCompact](https://getstream.github.io/stream-chat-react/#ChannelPreviewCompact) (default)
   * 2. [ChannelPreviewLastMessage](https://getstream.github.io/stream-chat-react/#ChannelPreviewLastMessage)
   * 3. [ChannelPreviewMessenger](https://getstream.github.io/stream-chat-react/#ChannelPreviewMessanger)
   *
   * The Preview to use, defaults to ChannelPreviewLastMessage
   * */
  Preview?: React.ComponentType<ChannelPreviewUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>>;
  /** Setter for selected Channel */
  setActiveChannel?: ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>['setActiveChannel'];
  /**
   * Object containing watcher parameters
   * @see See [Pagination documentation](https://getstream.io/chat/docs/react/channel_pagination/?language=js) for a list of available fields for sort.
   */
  watchers?: { limit?: number; offset?: number };
};

export const ChannelPreview = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { channel, Preview = ChannelPreviewCountOnly } = props;

  const { channel: activeChannel, client, setActiveChannel } = useChatContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { t, userLanguage } = useTranslationContext();

  const [lastMessage, setLastMessage] = useState<StreamMessage<At, Ch, Co, Ev, Me, Re, Us>>(
    channel.state.messages[channel.state.messages.length - 1],
  );
  const [unread, setUnread] = useState(0);

  const isActive = activeChannel?.cid === channel.cid;
  const { muted } = channel.muteStatus();

  useEffect(() => {
    if (isActive || muted) {
      setUnread(0);
    } else {
      setUnread(channel.countUnread());
    }
  }, [channel, isActive, muted]);

  useEffect(() => {
    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (event.message) setLastMessage(event.message);

      if (!isActive && !muted) {
        setUnread(channel.countUnread());
      } else {
        setUnread(0);
      }
    };

    channel.on('message.new', handleEvent);
    channel.on('message.updated', handleEvent);
    channel.on('message.deleted', handleEvent);

    return () => {
      channel.off('message.new', handleEvent);
      channel.off('message.updated', handleEvent);
      channel.off('message.deleted', handleEvent);
    };
  }, [channel, isActive, muted]);

  if (!Preview) return null;

  return (
    <Preview
      {...props}
      active={isActive}
      displayImage={getDisplayImage(channel, client.user)}
      displayTitle={getDisplayTitle(channel, client.user)}
      lastMessage={lastMessage}
      latestMessage={getLatestMessagePreview(channel, t, userLanguage)}
      setActiveChannel={setActiveChannel}
      unread={unread}
    />
  );
};
