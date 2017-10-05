declare module "module-alias" {
    interface ModuleAlias {
        addAlias(shortName: string, longName: string): void;
        addAliases(aliases: { [shortName: string]: string }): void;
        addPath(moduleDirectory: string): void;
        (packageJson: string): void;
        (): void;
    }

    const moduleAlias: ModuleAlias;
    export = moduleAlias;
}