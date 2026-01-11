import React from "react";
// import './Toolbar.css';

// class Toolbar extends React.Component{
//     render(){
//         let parent=200;
//         let height=150;
//         return(
//             <div style={{marginBottom:parent-height,border:'1px solid red'}}>{this.props.children}</div>
//         );
//     }
// }

// export default Toolbar;

const MyContext = React.createContext("Hello React");
class App extends React.Component {
    render() {
        return <Header />
    }
}
class Header extends React.Component {
    render() {
        return <Title />
    }
}

class Title extends React.Component {
    static contextType = MyContext;
render() {
return <h1>{this.context}</h1>
    }
}

export default App;