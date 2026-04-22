import PropTypes from 'prop-types';
import styled from '@emotion/styled';

export default function LogoContainer({
  logo,
  name = '',
  subname = '',
  previousData = {
    logo: '',
    name: '',
    subname: '',
  },
  ...rest
}) {
  let logoEle = <LogoImg logo={logo} />;
  let nameEle = name;
  let subnameEle = subname;

  if (previousData.logo) {
    logoEle = (
      <>
        <LogoImg logo={logo} className="left-fade-in-ele" />
        <LogoImg logo={previousData.logo} className="postion-abs left-fade-out-ele" />
      </>
    );
  }

  if (previousData.name && previousData.name !== name) {
    nameEle = (
      <>
        <span className="right-fade-in-ele" style={{ display: 'inline-block' }}>
          {name}
        </span>
        <span className="postion-abs right-fade-out-ele">{previousData.name}</span>
      </>
    );
  }

  if (previousData.subname && previousData.subname !== subname) {
    subnameEle = (
      <>
        <span className="right-fade-in-ele" style={{ display: 'inline-block' }}>
          {subname}
        </span>
        <span className="postion-abs right-fade-out-ele">{previousData.subname}</span>
      </>
    );
  }

  return (
    <Container {...rest}>
      <div className="logo-inner">
        <div className="logo-img-content">{logoEle}</div>
        <div className={`logo-info ${!name && !subname ? 'zero-left' : ''}`}>
          <div className="logo-name">{nameEle}</div>
          <div className="logo-subname">{subnameEle}</div>
        </div>
      </div>
    </Container>
  );
}

LogoContainer.propTypes = {
  logo: PropTypes.element.isRequired,
  name: PropTypes.string,
  subname: PropTypes.string,
  previousData: PropTypes.object,
};

// eslint-disable-next-line react/prop-types
function LogoImg({ logo, ...rest }) {
  return <LogoImgDiv {...rest}>{logo}</LogoImgDiv>;
}

const LogoImgDiv = styled.div`
  display: block;
  > * {
    display: block;
  }
`;

const Container = styled.div`
  position: relative;
  display: block;

  .logo-inner {
    display: flex;
    align-items: center;
    height: 100%;
    .logo-img-content {
      position: relative;
      display: block;
    }
    .logo-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin-left: 10px;
      letter-spacing: 0.1px;
      &.zero-left {
        margin-left: 0%;
      }
      .logo-name {
        position: relative;
        line-height: 16px;
        font-size: 16px;
        color: #121319;
      }
      .logo-subname {
        position: relative;
        line-height: 13px;
        font-size: 13px;
        color: #7d8085;
      }
    }
  }

  .postion-abs {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
  }

  .right-fade-out-ele {
    animation: right-fade-out ease 0.5s;
    animation-delay: 2s;
    animation-fill-mode: forwards;
  }

  .right-fade-in-ele {
    animation: right-fade-in ease 0.5s;
    animation-delay: 2s;
    animation-fill-mode: both;
  }

  @keyframes right-fade-out {
    0% {
      opacity: 1;
      transform: translate(0, 0);
    }
    100% {
      opacity: 0;
      transform: translate(8px, 0);
    }
  }

  @keyframes right-fade-in {
    0% {
      opacity: 0;
      transform: translate(8px, 0);
    }
    100% {
      opacity: 1;
      transform: translate(0, 0);
    }
  }

  .left-fade-out-ele {
    animation: left-fade-out ease 0.5s;
    animation-delay: 2s;
    animation-fill-mode: forwards;
  }

  .left-fade-in-ele {
    animation: left-fade-in ease 0.5s;
    animation-delay: 2s;
    animation-fill-mode: both;
  }

  @keyframes left-fade-out {
    0% {
      opacity: 1;
      transform: translate(0, 0);
    }
    100% {
      opacity: 0;
      transform: translate(-8px, 0);
    }
  }

  @keyframes left-fade-in {
    0% {
      opacity: 0;
      transform: translate(-8px, 0);
    }
    100% {
      opacity: 1;
      transform: translate(0, 0);
    }
  }
`;
