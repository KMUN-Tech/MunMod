import * as React from 'react';


export default class Footer extends React.PureComponent {
  render() {

    return (
      <div style={{ position: 'fixed', bottom: 5, left: 5, background: '#FFFFFF' }}>
        <a href="https://kmun.in" target="_blank">Visit the official site</a>
      </div>
    );
  }
}
