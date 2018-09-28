import * as React from 'react';
import * as firebase from 'firebase';
import { RouteComponentProps } from 'react-router';
import { Route, Link } from 'react-router-dom';
import { MemberData, MemberID } from './Member';
import Caucus, { CaucusData, CaucusID, DEFAULT_CAUCUS, CaucusStatus } from './Caucus';
import Resolution, { ResolutionData, ResolutionID, DEFAULT_RESOLUTION } from './Resolution';
import Admin from './Admin';
import { Icon, Input, Menu, Sticky, Grid, Segment, SemanticICONS, Button } from 'semantic-ui-react';
import Stats from './Stats';
import { MotionID, MotionData } from './Motions';
import { TimerData, DEFAULT_TIMER } from './Timer';
import Unmod from './Unmod';
import Notes from './Notes';
import Help from './Help';
import Motions from './Motions';
import { fieldHandler } from '../actions/handlers';
import { postCaucus } from '../actions/caucusActions';
import { URLParameters } from '../types';
import Loading from './Loading';
import Footer from './Footer';
import Settings, { SettingsData, DEFAULT_SETTINGS } from './Settings';
import Files, { FileID, FileData } from './Files';
import { ModalLogin } from './Auth';
import ShareHint from './ShareHint';
import Notifications from './Notifications';
import { postResolution } from '../actions/resolutionActions';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
}

export type CommitteeID = string;

export interface CommitteeData {
  name: string;
  chair: string;
  topic: string;
  creatorUid: firebase.UserInfo['uid'];
  members?: Map<MemberID, MemberData>;
  caucuses?: Map<CaucusID, CaucusData>;
  resolutions?: Map<ResolutionID, ResolutionData>;
  motions?: Map<MotionID, MotionData>;
  files?: Map<FileID, FileData>;
  timer: TimerData;
  notes: string;
  settings: SettingsData;
}

export const DEFAULT_COMMITTEE: CommitteeData = {
  name: '',
  chair: '',
  topic: '',
  creatorUid: '',
  members: {} as Map<MemberID, MemberData>,
  caucuses: {} as Map<CaucusID, CaucusData>,
  resolutions: {} as Map<ResolutionID, ResolutionData>,
  files: {} as Map<FileID, FileData>,
  timer: DEFAULT_TIMER,
  notes: '',
  settings: DEFAULT_SETTINGS
};

export default class Committee extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const committeeID: CommitteeID = this.props.match.params.committeeID;

    this.state = {
      committeeFref: firebase.database().ref('committees').child(committeeID),
    };
  }

  firebaseCallback = (committee: firebase.database.DataSnapshot | null) => {
    if (committee) {
      this.setState({ committee: committee.val() });
    }
  }

  componentDidMount() {
    this.state.committeeFref.on('value', this.firebaseCallback);
  }

  componentWillUnmount() {
    this.state.committeeFref.off('value', this.firebaseCallback);
  }

  pushCaucus = () => {
    const committeeID: CommitteeID = this.props.match.params.committeeID;

    const newCaucus: CaucusData = {
      ...DEFAULT_CAUCUS,
      name: 'untitled caucus',
    };

    const ref = postCaucus(committeeID, newCaucus);

    this.props.history
      .push(`/committees/${committeeID}/caucuses/${ref.key}`);
  }

  pushResolution = () => {
    const committeeID: CommitteeID = this.props.match.params.committeeID;

    const newResolution: ResolutionData = {
      ...DEFAULT_RESOLUTION,
      name: 'untitled resolution',
    };

    const ref = postResolution(committeeID, newResolution);

    this.props.history
      .push(`/committees/${committeeID}/resolutions/${ref.key}`);
  }

  makeMenuItem = (name: string, icon: SemanticICONS) => {
    const committeeID: CommitteeID = this.props.match.params.committeeID;
    const caucusID: CaucusID = this.props.match.params.committeeID;

    return (
      <Menu.Item
        key={name}
        name={name.toLowerCase()}
        active={false}
        onClick={() => this.props.history.push(`/committees/${committeeID}/${name.toLowerCase()}`)}
      >
        <Icon name={icon} />
        {name}
      </Menu.Item>
    );
  }

  makeSubmenuItem = (id: string, name: string, type: 'caucuses' | 'resolutions') => {
    const { committeeID, caucusID, resolutionID } = this.props.match.params;

    let active = false;

    if (type === 'caucuses') {
      active = (id === caucusID);
    } else if (type === 'resolutions') {
      active = (id === resolutionID);
    }

    return (
      <Menu.Item
        key={id}
        name={name}
        active={active}
        onClick={() => this.props.history.push(`/committees/${committeeID}/${type}/${id}`)}
      >
        {name}
      </Menu.Item>
    );
  }

  renderNav = () => {
    const { makeMenuItem, makeSubmenuItem } = this;
    const { committee } = this.state;

    const caucuses = committee ? committee.caucuses : undefined;
    const resolutions = committee ? committee.resolutions : undefined;

    // BADCODE: Filter predicate shared with caucus target in motions, also update when changing
    const caucusItems = Object.keys(caucuses || {}).filter(key =>
      caucuses![key].status === CaucusStatus.Open.toString() && !caucuses![key].deleted
    ).map(key =>
      makeSubmenuItem(key, caucuses![key].name, 'caucuses')
    );

    const resolutionItems = Object.keys(resolutions || {}).map(key =>
      makeSubmenuItem(key, resolutions![key].name, 'resolutions')
    );

    return (
      <Menu fluid vertical size="massive">
        {makeMenuItem('Admin', 'users')}
        {makeMenuItem('Motions', 'sort numeric descending')}
        {makeMenuItem('Unmod', 'discussions')}
        <Menu.Item>
          <Button
            icon="add"
            size="mini"
            primary
            basic
            floated="right"
            onClick={this.pushCaucus}
          />
          Caucuses
            <Menu.Menu>
            {!committee && <Loading />}
            {caucusItems}
          </Menu.Menu>
        </Menu.Item>
        <Menu.Item>
          <Button
            icon="add"
            size="mini"
            primary
            basic
            floated="right"
            onClick={this.pushResolution}
          />
          Resolutions
            <Menu.Menu>
            {!committee && <Loading />}
            {resolutionItems}
          </Menu.Menu>
        </Menu.Item>
        {makeMenuItem('Notes', 'sticky note outline')}
        {makeMenuItem('Files', 'file outline')}
        {makeMenuItem('Stats', 'bar chart')}
        {makeMenuItem('Settings', 'settings')}
        {makeMenuItem('Help', 'help')}
      </Menu>
    );
  }

  renderMeta = () => {
    const { committee, committeeFref } = this.state;

    return (
      <Segment loading={!committee}>
        <Input
          value={committee ? committee.name : ''}
          onChange={fieldHandler<CommitteeData>(committeeFref, 'name')}
          attached="top"
          size="massive"
          fluid
          placeholder="Committee Name"
        />
        <Input 
          value={committee ? committee.topic : ''} 
          onChange={fieldHandler<CommitteeData>(committeeFref, 'topic')} 
          attached="bottom" 
          fluid 
          placeholder="Committee Topic" 
        />
      </Segment>
    );
  }

  renderAdmin = () => {
    return (
      <Admin
        committee={this.state.committee || DEFAULT_COMMITTEE}
        fref={this.state.committeeFref}
      />
    );
  }
    
  render() {
    const { renderNav, renderAdmin, renderMeta } = this;

    return (
      <div>
        <Notifications {...this.props} />
        <ShareHint committeeID={this.props.match.params.committeeID} />
        <ModalLogin />
        <div>
          {renderMeta()}
          <Grid>
            <Grid.Column width={4}>
              {renderNav()}
              <Footer />
            </Grid.Column>
            <Grid.Column width={12}>
              <Route exact={true} path="/committees/:committeeID/admin" render={renderAdmin} />
              <Route exact={true} path="/committees/:committeeID/stats" component={Stats} />
              <Route exact={true} path="/committees/:committeeID/unmod" component={Unmod} />
              <Route exact={true} path="/committees/:committeeID/motions" component={Motions} />
              <Route exact={true} path="/committees/:committeeID/notes" component={Notes} />
              <Route exact={true} path="/committees/:committeeID/files" component={Files} />
              <Route exact={true} path="/committees/:committeeID/settings" component={Settings} />
              <Route exact={true} path="/committees/:committeeID/help" component={Help} />
              <Route path="/committees/:committeeID/caucuses/:caucusID" component={Caucus} />
              <Route path="/committees/:committeeID/resolutions/:resolutionID" component={Resolution} />
            </Grid.Column>
          </Grid>
        </div>
      </div>
    );
  }
}
