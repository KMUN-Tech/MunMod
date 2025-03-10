import * as React from 'react';
import { CommitteeID } from './Committee';
import { Divider, Header, Input, List, Segment } from 'semantic-ui-react';
import { StrawpollID } from './Strawpoll';

function CopyableText(props: {
  value: string
}) {
  const [message, setMessage] = React.useState<string>('Copy');

  const copy = () => {
    // We have to try-catch because this API might not be available
    try {
      navigator.clipboard.writeText(props.value)
        .then(() => {
          setMessage('Copied')
          setTimeout(() => setMessage('Copy'), 3000)
        })
        .catch(() => {
          setMessage('Please copy manually')
        })
    } catch (e) {
      setMessage('Please copy manually')
    }
  }

  return (
      <Input fluid
        value={props.value}
        action={{
          labelPosition: 'right',
          icon: 'copy outline',
          content: message,
          onClick: copy
        }}
      />
  );
}


export function ShareCapabilities() {
  return (
      <List bulleted>
        <List.Item>Upload files</List.Item>
        <List.Item>Add themselves to speakers' lists</List.Item>
        <List.Item>Add and edit amendments on resolutions</List.Item>
        <List.Item>Propose motions</List.Item>
        <List.Item>Vote on motions</List.Item>
        <List.Item>Vote on strawpolls</List.Item>
      </List>
  )
}

export function StrawpollShareHint(props: {
  committeeID: CommitteeID;
  strawpollID: StrawpollID;
}) {
  const hostname = window.location.hostname;
  const { committeeID, strawpollID } = props;
  const url = `${hostname}/committees/${committeeID}/strawpolls/${strawpollID}`;
  return (
    <Segment>
      <Header size='small'>Here's the shareable link to your strawpoll</Header>
      <CopyableText value={url} />
    </Segment>
  );
}

export function MotionsShareHint(props: {
  canVote: boolean,
  canPropose: boolean,
  committeeID: CommitteeID;
}) {
  const hostname = window.location.hostname;
  const { committeeID, canVote, canPropose } = props;
  const url = `${hostname}/committees/${committeeID}/motions`;

  let action: string

  if (canVote && canPropose) {
    action = 'vote on and propose motions'
  } else if (canVote) {
    action = 'vote on motions'
  } else if (canPropose) {
    action = 'propose motions'
  } else {
    action = 'vote on and propose motions'
  }

  return (
    <Segment>
      <Header size='small'>Here's the shareable link to {action}</Header>
      <CopyableText value={url} />
    </Segment>
  );
}
