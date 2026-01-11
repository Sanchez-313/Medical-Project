// export default function AboutPage(){
//     return(
//         <>
//             <h1>About</h1>
//             <p>Hello there. <br />How do you do?</p>
//         </>
//     );
// }

//profile
// const user = {
//     name: 'Hedy Lamarr',
//     imageUrl: '/src/components/testing/boy.avif',
//     imageSize: 50,

// };

const products = [
    {title: 'Cabbage', isFruit: false, id: 1},
    {title: 'Garlic', isFruit: false, id: 2},
    {title: 'Apple', isFruit: true, id: 3},
]

export default function Profile(){

    const listItems = products.map(product =>
        <li key={product.id} style={{color: product.isFruit ? 'magenta' : 'darkgreen'}}>
            {product.title}
        </li>
    );

    return(
        <>
        {/* <h1>{user.name}</h1>
        <img className="rounded-4xl" src={user.imageUrl} alt={'Photo of ' + user.name} style={{
            width: user.imageSize,
            height: user.imageSize
        }} /> */}
        
        <ul>{listItems}</ul>
        
        </>
    );
}