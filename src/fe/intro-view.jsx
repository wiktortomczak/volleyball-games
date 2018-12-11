
import PropTypes from 'prop-types';
import React from 'react';


export default class IntroSection extends React.Component {

  render() {
    return (
      <section id="intro" className="text">
        <p>
          Welcome!
        </p>
        <p>
          TODO: Description.
        </p>
        <p>
          <a href="https://facebook.com/groups/307483076649700/">
            <img src="facebook-20x20.png" width="20" heigth="20" />
            Volleyball in Warsaw<br/>
          </a> Check it out for latest news.
        </p>
        <p>
          <span className="important">Note:</span> This is work in progress.
        </p>
        <p>
          The following does not work yet:
          <ul>
            <li>Email notifications.</li>
            <li>Support for any web browser and for mobile phones.<br/>
                Use Chrome 63+ or Firefox 52+ on a desktop computer.</li>
          </ul>
          If you notice any technical problems, please let Wiktor know.<br/>
          (contact details at the bottom)
        </p>
      </section>
    );
  }
}
